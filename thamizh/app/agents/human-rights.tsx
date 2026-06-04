import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ACCENT,
  ACCENT_SOFT,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
  DANGER,
} from "@/lib/theme";

const API = "https://cf-agents.tamilframework.workers.dev";

type Incident = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
  severity: string;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  massacre: "#D93025",
  disappearance: "#E37400",
  displacement: "#188038",
  war_crime: "#A50E0E",
  political: "#1A73E8",
  legal: "#9334E6",
  other: MUTED,
};

const SEVERITY_LABELS: Record<string, string> = {
  "1": "Low",
  "2": "Medium",
  "3": "High",
  "4": "Critical",
  "5": "Genocide",
};

const CATEGORIES = ["massacre", "disappearance", "displacement", "war_crime", "political", "legal", "other"];
const SEVERITIES = ["1", "2", "3", "4", "5"];

export default function HumanRightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state (shared by add + edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", date: "", location: "", description: "", category: "massacre", severity: "3" });

  // Detail view
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/evidence/incidents`);
      setIncidents(await res.json());
    } catch (e) {
      console.error("fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: "", date: "", location: "", description: "", category: "massacre", severity: "3" });
    setShowForm(true);
  };

  const openEdit = (inc: Incident) => {
    setEditingId(inc.id);
    setForm({ title: inc.title, date: inc.date, location: inc.location, description: inc.description, category: inc.category, severity: inc.severity });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert("Required", "Title is required"); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await fetch(`${API}/api/evidence/incidents/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Update failed"); }
      } else {
        const res = await fetch(`${API}/api/evidence/incidents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.id) throw new Error(data.error ?? "Create failed");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: "", date: "", location: "", description: "", category: "massacre", severity: "3" });
      setLoading(true);
      await fetchIncidents();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (inc: Incident) => {
    setLoadingDetail(true);
    setDetailIncident(inc);
    try {
      const res = await fetch(`${API}/api/evidence/incidents/${inc.id}`);
      if (res.ok) setDetailIncident(await res.json());
    } catch {}
    setLoadingDetail(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#1A1A2E" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "white" }}>Human Rights Evidence</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Document incidents · Track atrocities · Build cases</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: "white", fontWeight: "600" }}>{incidents.length} incidents</Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: "white", fontWeight: "600" }}>Live · CF Worker</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ marginTop: 8, fontSize: 13, color: MUTED }}>Loading incidents...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {incidents.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
              <Ionicons name="shield-outline" size={48} color={MUTED} />
              <Text style={{ fontSize: 16, color: MUTED, marginTop: 12, textAlign: "center" }}>No incidents recorded yet</Text>
              <Text style={{ fontSize: 13, color: MUTED, marginTop: 4, textAlign: "center" }}>Tap + to add the first evidence</Text>
            </View>
          ) : (
            incidents.map((inc) => {
              const catColor = CATEGORY_COLORS[inc.category] ?? MUTED;
              return (
                <Pressable
                  key={inc.id}
                  onPress={() => openDetail(inc)}
                  android_ripple={{ color: SURFACE_HOVER }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? SURFACE_HOVER : "white",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: HAIRLINE,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 6, height: 40, borderRadius: 3, backgroundColor: catColor, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: TEXT }}>{inc.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                        {inc.date ? <Text style={{ fontSize: 11, color: MUTED }}>{inc.date}</Text> : null}
                        {inc.location ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                            <Ionicons name="location-outline" size={10} color={MUTED} />
                            <Text style={{ fontSize: 11, color: MUTED }}>{inc.location}</Text>
                          </View>
                        ) : null}
                        <View style={{ backgroundColor: catColor + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 9, color: catColor, fontWeight: "700", textTransform: "uppercase" }}>{inc.category}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: ACCENT, fontWeight: "700" }}>{SEVERITY_LABELS[inc.severity] ?? `Lv${inc.severity}`}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      <Pressable
        onPress={openAdd}
        style={{
          position: "absolute", bottom: insets.bottom + 20, right: 20,
          width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT,
          alignItems: "center", justifyContent: "center",
          elevation: 6, shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      {/* Detail Modal */}
      <Modal visible={!!detailIncident} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ flex: 1, marginTop: 60, backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12 }}>
            {loadingDetail ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color={ACCENT} />
              </View>
            ) : detailIncident ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
                  <Text style={{ flex: 1, fontSize: 18, fontWeight: "600", color: TEXT }}>{detailIncident.title}</Text>
                  <Pressable onPress={() => setDetailIncident(null)}>
                    <Ionicons name="close" size={24} color={MUTED} />
                  </Pressable>
                </View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  {detailIncident.description ? (
                    <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 14 }}>
                      <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 6 }}>DESCRIPTION</Text>
                      <Text style={{ fontSize: 14, color: TEXT, lineHeight: 20 }}>{detailIncident.description}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {detailIncident.date ? (
                      <InfoBlock label="DATE" value={detailIncident.date} icon="calendar-outline" />
                    ) : null}
                    {detailIncident.location ? (
                      <InfoBlock label="LOCATION" value={detailIncident.location} icon="location-outline" />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <InfoBlock label="CATEGORY" value={detailIncident.category.replace(/_/g, " ")} icon="pricetag-outline" color={CATEGORY_COLORS[detailIncident.category] ?? MUTED} />
                    <InfoBlock label="SEVERITY" value={SEVERITY_LABELS[detailIncident.severity] ?? `Level ${detailIncident.severity}`} icon="alert-circle-outline" />
                  </View>
                  <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 14 }}>
                    <Text style={{ fontSize: 11, color: MUTED }}>ID: {detailIncident.id}</Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Recorded: {detailIncident.created_at ? new Date(detailIncident.created_at).toLocaleString() : "Unknown"}</Text>
                  </View>
                </ScrollView>
                <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, gap: 8 }}>
                  <Pressable
                    onPress={() => { const inc = detailIncident; setDetailIncident(null); openEdit(inc); }}
                    style={{ backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="create-outline" size={16} color="white" />
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>Edit Incident</Text>
                    </View>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ flex: 1, marginTop: 80, backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: "600", color: TEXT }}>{editingId ? "Edit Incident" : "Record Incident"}</Text>
              <Pressable onPress={() => { setShowForm(false); setEditingId(null); }}>
                <Ionicons name="close" size={24} color={MUTED} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>TITLE</Text>
                <TextInput value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Mullivaikkal Massacre" placeholderTextColor={MUTED} style={{ backgroundColor: SURFACE_ALT, borderRadius: 10, paddingHorizontal: 12, height: 44, color: TEXT, fontSize: 14 }} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>DATE</Text>
                <TextInput value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="e.g. 2009-05-18" placeholderTextColor={MUTED} style={{ backgroundColor: SURFACE_ALT, borderRadius: 10, paddingHorizontal: 12, height: 44, color: TEXT, fontSize: 14 }} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>LOCATION</Text>
                <TextInput value={form.location} onChangeText={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="e.g. Mullivaikkal, Vanni" placeholderTextColor={MUTED} style={{ backgroundColor: SURFACE_ALT, borderRadius: 10, paddingHorizontal: 12, height: 44, color: TEXT, fontSize: 14 }} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>CATEGORY</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                      style={({ pressed }) => ({
                        backgroundColor: form.category === cat ? ACCENT : SURFACE_ALT,
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 12, color: form.category === cat ? "white" : TEXT, fontWeight: "500", textTransform: "capitalize" }}>{cat.replace(/_/g, " ")}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>SEVERITY</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {SEVERITIES.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setForm((f) => ({ ...f, severity: s }))}
                      style={({ pressed }) => ({
                        flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10,
                        backgroundColor: form.severity === s ? ACCENT : SURFACE_ALT, opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 11, color: form.severity === s ? "white" : TEXT, fontWeight: "600" }}>{SEVERITY_LABELS[s]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600", marginBottom: 4 }}>DESCRIPTION</Text>
                <TextInput value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Details of the incident..." placeholderTextColor={MUTED} multiline numberOfLines={4} style={{ backgroundColor: SURFACE_ALT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: TEXT, fontSize: 14, minHeight: 80, textAlignVertical: "top" }} />
              </View>
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center",
                  opacity: submitting ? 0.6 : 1, marginTop: 8,
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>{editingId ? "Save Changes" : "Submit Evidence"}</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoBlock({ label, value, icon, color }: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 14 }}>
      {icon ? <Ionicons name={icon} size={16} color={color ?? ACCENT} style={{ marginBottom: 4 }} /> : null}
      <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 14, color: color ?? TEXT, fontWeight: "500", marginTop: 2, textTransform: "capitalize" }}>{value}</Text>
    </View>
  );
}
