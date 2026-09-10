"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, Trash2, Sparkles, CheckCircle2, Wand2, ScanText, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ResumeContent,
  type ResumeExperience,
  type ResumeEducation,
  type ResumeCertification,
  type FactStatus,
  newId,
} from "@/lib/resume-types";
import type { ActionState } from "@/lib/actions/resumes";
import { parseResumeText, extractResumeFileText } from "@/lib/actions/resume-parsing";

const FACT_STATUS_LABEL: Record<FactStatus, string> = {
  verified: "Verified",
  user_added: "User added",
  ai_reworded: "AI reworded",
  ai_extracted: "AI extracted",
};

function FactBadge({ status }: { status: FactStatus }) {
  const variant =
    status === "verified" ? "success" : status === "user_added" ? "outline" : "secondary";
  return (
    <Badge variant={variant} className="shrink-0">
      {status === "ai_reworded" || status === "ai_extracted" ? (
        <Wand2 className="size-3" />
      ) : (
        <CheckCircle2 className="size-3" />
      )}
      {FACT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ResumeEditor({
  action,
  initialContent,
  initialRawText,
  aiConfigured,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialContent: ResumeContent;
  initialRawText?: string | null;
  aiConfigured: boolean;
}) {
  const [content, setContent] = React.useState<ResumeContent>(initialContent);
  const [rawText, setRawText] = React.useState(initialRawText ?? "");
  const [activeTab, setActiveTab] = React.useState("structured");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(action, {});

  React.useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  async function parseTextIntoFields(text: string) {
    const result = await parseResumeText(text);
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    setContent((c) => ({ ...result.content, target_titles: c.target_titles }));
    setActiveTab("structured");
    toast.success("Parsed — review every field below, then save when it looks right.");
    return true;
  }

  async function handleParseWithAi() {
    setIsParsing(true);
    try {
      await parseTextIntoFields(rawText);
    } catch {
      toast.error("Couldn't parse resume text. Try again.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const extracted = await extractResumeFileText(formData);
      if ("error" in extracted) {
        toast.error(extracted.error);
        return;
      }
      setRawText(extracted.text);
      if (aiConfigured) {
        setIsParsing(true);
        try {
          await parseTextIntoFields(extracted.text);
        } finally {
          setIsParsing(false);
        }
      } else {
        setActiveTab("raw");
        toast.success("Text extracted — copy it into the structured fields manually.");
      }
    } catch {
      toast.error("Couldn't read that file. Try a different PDF or DOCX export.");
    } finally {
      setIsUploading(false);
    }
  }

  function updateContact<K extends keyof ResumeContent["contact"]>(key: K, value: string) {
    setContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  }

  function addSkillGroup() {
    setContent((c) => ({ ...c, skills: [...c.skills, { category: "Other", items: [] }] }));
  }

  function addExperience() {
    const exp: ResumeExperience = {
      id: newId(),
      company: "",
      client: "",
      title: "",
      start_date: "",
      end_date: "",
      is_current: false,
      location: "",
      employment_type: "Full-time",
      technologies: [],
      bullets: [],
    };
    setContent((c) => ({ ...c, experience: [...c.experience, exp] }));
  }

  function addEducation() {
    const edu: ResumeEducation = {
      id: newId(),
      degree: "",
      university: "",
      start_date: "",
      end_date: "",
      notes: "",
    };
    setContent((c) => ({ ...c, education: [...c.education, edu] }));
  }

  function addCertification() {
    const cert: ResumeCertification = {
      id: newId(),
      name: "",
      issuer: "",
      date: "",
      expiration: "",
    };
    setContent((c) => ({ ...c, certifications: [...c.certifications, cert] }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <input type="hidden" name="raw_text" value={rawText} />
      <input type="hidden" name="change_summary" value="Manual edit" />

      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Upload a resume file</p>
            <p className="text-xs text-muted-foreground">
              PDF or DOCX.{" "}
              {aiConfigured
                ? "Text is extracted and AI-parsed into the fields below automatically."
                : "Text is extracted, but configure an AI provider to auto-fill the fields."}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading || isParsing}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading || isParsing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}
            {isUploading ? "Reading file…" : isParsing ? "Parsing…" : "Upload resume"}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="structured">Structured resume</TabsTrigger>
          <TabsTrigger value="raw">Pasted text</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pasted resume text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={16}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your raw resume text here."
              />
              {aiConfigured ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleParseWithAi}
                  disabled={isParsing || !rawText.trim()}
                >
                  {isParsing ? <Loader2 className="animate-spin" /> : <ScanText />}
                  Parse with AI
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Configure an AI provider to auto-extract this into structured fields, or fill
                  them in manually on the other tab.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Parsing only extracts what&apos;s in your text above — it never invents
                companies, dates, or bullets — and only fills the Structured resume tab once you
                click the button. Nothing saves until you click &quot;Save new version&quot;
                below.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structured" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={content.contact.full_name}
                  onChange={(e) => updateContact("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={content.contact.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={content.contact.phone}
                  onChange={(e) => updateContact("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={content.contact.location}
                  onChange={(e) => updateContact("location", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={content.contact.linkedin_url}
                  onChange={(e) => updateContact("linkedin_url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input
                  value={content.contact.github_url}
                  onChange={(e) => updateContact("github_url", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Portfolio</Label>
                <Input
                  value={content.contact.portfolio_url}
                  onChange={(e) => updateContact("portfolio_url", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Professional summary</Label>
                <Textarea
                  rows={3}
                  value={content.professional_summary}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, professional_summary: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Current title</Label>
                <Input
                  value={content.current_title}
                  onChange={(e) => setContent((c) => ({ ...c, current_title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Years of experience</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={content.years_experience ?? ""}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      years_experience: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Target titles (comma-separated)</Label>
                <Input
                  value={content.target_titles.join(", ")}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      target_titles: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Skills</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSkillGroup}>
                <Plus /> Add category
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skill categories yet.</p>
              )}
              {content.skills.map((group, idx) => (
                <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <Input
                    className="w-full sm:w-40 sm:shrink-0"
                    value={group.category}
                    onChange={(e) =>
                      setContent((c) => {
                        const skills = [...c.skills];
                        skills[idx] = { ...skills[idx], category: e.target.value };
                        return { ...c, skills };
                      })
                    }
                    placeholder="Category"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <Input
                      className="min-w-0 flex-1"
                      value={group.items.join(", ")}
                      onChange={(e) =>
                        setContent((c) => {
                          const skills = [...c.skills];
                          skills[idx] = {
                            ...skills[idx],
                            items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          };
                          return { ...c, skills };
                        })
                      }
                      placeholder="AWS, Kubernetes, Terraform"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setContent((c) => ({ ...c, skills: c.skills.filter((_, i) => i !== idx) }))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Experience</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                <Plus /> Add position
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.experience.length === 0 && (
                <p className="text-sm text-muted-foreground">No experience entries yet.</p>
              )}
              {content.experience.map((exp, idx) => (
                <div key={exp.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Position {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          experience: c.experience.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], company: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <Input
                      placeholder="Client (optional, for consulting)"
                      value={exp.client}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], client: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <Input
                      placeholder="Title"
                      value={exp.title}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], title: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <Input
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], location: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <Input
                      type="month"
                      value={exp.start_date}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], start_date: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="month"
                        value={exp.end_date}
                        disabled={exp.is_current}
                        onChange={(e) =>
                          setContent((c) => {
                            const experience = [...c.experience];
                            experience[idx] = { ...experience[idx], end_date: e.target.value };
                            return { ...c, experience };
                          })
                        }
                      />
                      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Checkbox
                          checked={exp.is_current}
                          onCheckedChange={(checked) =>
                            setContent((c) => {
                              const experience = [...c.experience];
                              experience[idx] = {
                                ...experience[idx],
                                is_current: checked === true,
                              };
                              return { ...c, experience };
                            })
                          }
                        />
                        Current
                      </label>
                    </div>
                    <Input
                      placeholder="Employment type (e.g. Full-time)"
                      value={exp.employment_type}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = { ...experience[idx], employment_type: e.target.value };
                          return { ...c, experience };
                        })
                      }
                    />
                    <Input
                      placeholder="Technologies (comma-separated)"
                      value={exp.technologies.join(", ")}
                      onChange={(e) =>
                        setContent((c) => {
                          const experience = [...c.experience];
                          experience[idx] = {
                            ...experience[idx],
                            technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          };
                          return { ...c, experience };
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Responsibilities & achievements</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setContent((c) => {
                            const experience = [...c.experience];
                            experience[idx] = {
                              ...experience[idx],
                              bullets: [
                                ...experience[idx].bullets,
                                { text: "", status: "user_added" as FactStatus },
                              ],
                            };
                            return { ...c, experience };
                          })
                        }
                      >
                        <Plus /> Add bullet
                      </Button>
                    </div>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <FactBadge status={bullet.status} />
                        <Input
                          className="min-w-0 flex-1"
                          value={bullet.text}
                          onChange={(e) =>
                            setContent((c) => {
                              const experience = [...c.experience];
                              const bullets = [...experience[idx].bullets];
                              bullets[bIdx] = { ...bullets[bIdx], text: e.target.value };
                              experience[idx] = { ...experience[idx], bullets };
                              return { ...c, experience };
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() =>
                            setContent((c) => {
                              const experience = [...c.experience];
                              experience[idx] = {
                                ...experience[idx],
                                bullets: experience[idx].bullets.filter((_, i) => i !== bIdx),
                              };
                              return { ...c, experience };
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Education</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                <Plus /> Add education
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.education.length === 0 && (
                <p className="text-sm text-muted-foreground">No education entries yet.</p>
              )}
              {content.education.map((edu, idx) => (
                <div key={edu.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  <Input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) =>
                      setContent((c) => {
                        const education = [...c.education];
                        education[idx] = { ...education[idx], degree: e.target.value };
                        return { ...c, education };
                      })
                    }
                  />
                  <Input
                    placeholder="University"
                    value={edu.university}
                    onChange={(e) =>
                      setContent((c) => {
                        const education = [...c.education];
                        education[idx] = { ...education[idx], university: e.target.value };
                        return { ...c, education };
                      })
                    }
                  />
                  <Input
                    type="month"
                    value={edu.start_date}
                    onChange={(e) =>
                      setContent((c) => {
                        const education = [...c.education];
                        education[idx] = { ...education[idx], start_date: e.target.value };
                        return { ...c, education };
                      })
                    }
                  />
                  <Input
                    type="month"
                    value={edu.end_date}
                    onChange={(e) =>
                      setContent((c) => {
                        const education = [...c.education];
                        education[idx] = { ...education[idx], end_date: e.target.value };
                        return { ...c, education };
                      })
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Notes (honors, GPA, coursework)"
                    value={edu.notes}
                    onChange={(e) =>
                      setContent((c) => {
                        const education = [...c.education];
                        education[idx] = { ...education[idx], notes: e.target.value };
                        return { ...c, education };
                      })
                    }
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          education: c.education.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="size-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Certifications</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                <Plus /> Add certification
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.certifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No certifications yet.</p>
              )}
              {content.certifications.map((cert, idx) => (
                <div key={cert.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  <Input
                    placeholder="Certification name"
                    value={cert.name}
                    onChange={(e) =>
                      setContent((c) => {
                        const certifications = [...c.certifications];
                        certifications[idx] = { ...certifications[idx], name: e.target.value };
                        return { ...c, certifications };
                      })
                    }
                  />
                  <Input
                    placeholder="Issuer"
                    value={cert.issuer}
                    onChange={(e) =>
                      setContent((c) => {
                        const certifications = [...c.certifications];
                        certifications[idx] = { ...certifications[idx], issuer: e.target.value };
                        return { ...c, certifications };
                      })
                    }
                  />
                  <Input
                    type="month"
                    placeholder="Issued"
                    value={cert.date}
                    onChange={(e) =>
                      setContent((c) => {
                        const certifications = [...c.certifications];
                        certifications[idx] = { ...certifications[idx], date: e.target.value };
                        return { ...c, certifications };
                      })
                    }
                  />
                  <Input
                    type="month"
                    placeholder="Expires"
                    value={cert.expiration}
                    onChange={(e) =>
                      setContent((c) => {
                        const certifications = [...c.certifications];
                        certifications[idx] = { ...certifications[idx], expiration: e.target.value };
                        return { ...c, certifications };
                      })
                    }
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          certifications: c.certifications.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="size-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" /> AI tailoring is available per-job from a job&apos;s page
          — it only rewords or reorders bullets you&apos;ve entered here, never invents new ones.
          Pasted text above is a reference copy only; it doesn&apos;t auto-fill these fields yet.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Save new version
        </Button>
      </div>
    </form>
  );
}
