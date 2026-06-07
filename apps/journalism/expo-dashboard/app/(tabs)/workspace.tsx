import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTheme, Card, Badge, Timeline } from '@tamilfw/ui';
import type { Note, Document, ListParams } from '@tamilfw/core/journalism';

const TABS = [
  { id: 'notes', label: 'NOTES', icon: '✎' },
  { id: 'sources', label: 'SOURCES', icon: '◫' },
  { id: 'timeline', label: 'TIMELINE', icon: '◷' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function WorkspaceTab() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getStorage } = await import('@tamilfw/core');
        const storage = getStorage();
        const [notesData, docsData] = await Promise.all([
          storage.listNotes({ limit: 20, offset: 0 }),
          storage.listDocuments({ limit: 20, offset: 0 }),
        ]);
        setNotes(notesData);
        setDocuments(docsData.documents);
      } catch (err) {
        console.warn('Failed to load workspace:', err);
        setNotes([]);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: theme.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            color: theme.colors.fg,
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          WORKSPACE
        </Text>
        <Text style={{ color: theme.colors.fgDim, fontSize: 12 }}>
          {notes.length} notes • {documents.length} sources
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.bg,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? theme.colors.accent : 'transparent',
              }}
            >
              <Text style={{ color: isActive ? theme.colors.accent : theme.colors.fgMuted, fontSize: 14 }}>
                {tab.icon}
              </Text>
              <Text
                style={{
                  color: isActive ? theme.colors.accent : theme.colors.fgMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {activeTab === 'notes' && (
          <>
            {notes.length === 0 ? (
              <EmptyState
                title="No notes yet"
                subtitle="Create notes linked to entities or articles"
                hint="Use @entity in notes to link"
              />
            ) : (
              notes.map((note) => (
                <Card key={note.id} variant="bordered" padding={12}>
                  <Text style={{ color: theme.colors.fg, fontSize: 13, lineHeight: 18, marginBottom: 8 }}>
                    {note.content}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {note.tags.map((tag) => (
                      <Badge key={tag} label={tag} size="sm" />
                    ))}
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'sources' && (
          <>
            {documents.length === 0 ? (
              <EmptyState
                title="No documents yet"
                subtitle="Upload PDFs, images, and other evidence"
                hint="Coming soon"
              />
            ) : (
              documents.map((doc) => (
                <Card key={doc.id} variant="bordered" padding={12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <FileText size={20} color={theme.colors.fgMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.fg, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text style={{ color: theme.colors.fgDim, fontSize: 11, marginTop: 2 }}>
                        {doc.type} • {Math.round(doc.sizeBytes / 1024)} KB
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'timeline' && (
          <>
            {notes.length === 0 && documents.length === 0 ? (
              <EmptyState
                title="No events yet"
                subtitle="Timeline aggregates notes, articles, and documents"
                hint="Add content to populate"
              />
            ) : (
              <Card variant="bordered" padding={16}>
                <Timeline
                  items={[
                    ...notes.map((n) => ({
                      id: n.id,
                      title: 'Note',
                      description: n.content.slice(0, 100),
                      date: n.updatedAt,
                      type: 'note' as const,
                    })),
                    ...documents.map((d) => ({
                      id: d.id,
                      title: d.title,
                      description: `${d.type} document`,
                      date: d.createdAt,
                      type: 'document' as const,
                    })),
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ title, subtitle, hint }: { title: string; subtitle: string; hint: string }) {
  const theme = useTheme();
  return (
    <Card variant="bordered" padding={32}>
      <Text
        style={{
          color: theme.colors.fgMuted,
          fontSize: 14,
          textAlign: 'center',
          fontWeight: '600',
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: theme.colors.fgDim, fontSize: 12, textAlign: 'center' }}>
        {subtitle}
      </Text>
      <Text
        style={{
          color: theme.colors.accent,
          fontSize: 10,
          textAlign: 'center',
          marginTop: 8,
          fontFamily: 'SpaceMono',
        }}
      >
        {hint}
      </Text>
    </Card>
  );
}