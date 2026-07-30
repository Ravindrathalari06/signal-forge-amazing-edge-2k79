'use client'

import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2,
  Upload,
  CheckCircle2,
  Loader2,
  Search,
  Users,
  Sparkles,
  UserPlus,
} from 'lucide-react'

export interface ProspectItem {
  name: string
  role?: string
  fit_reason?: string
}

interface WorkspaceLeftProps {
  kbFileName: string | null
  kbUploading: boolean
  onUploadFile: (file: File) => void
  targetCompany: string
  setTargetCompany: (v: string) => void
  onResearch: () => void
  researchLoading: boolean
  prospects: ProspectItem[]
  prospectLoading: boolean
  selectedProspect: ProspectItem | null
  onSelectProspect: (p: ProspectItem | null) => void
  customName: string
  setCustomName: (v: string) => void
  customRole: string
  setCustomRole: (v: string) => void
  onGenerateOutreach: () => void
  outreachLoading: boolean
  hasResearch: boolean
}

export default function WorkspaceLeft(props: WorkspaceLeftProps) {
  const {
    kbFileName,
    kbUploading,
    onUploadFile,
    targetCompany,
    setTargetCompany,
    onResearch,
    researchLoading,
    prospects,
    prospectLoading,
    selectedProspect,
    onSelectProspect,
    customName,
    setCustomName,
    customRole,
    setCustomRole,
    onGenerateOutreach,
    outreachLoading,
    hasResearch,
  } = props

  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onUploadFile(file)
  }

  const hasCustom = customName.trim().length > 0 || customRole.trim().length > 0
  const canGenerate =
    !!kbFileName &&
    ((selectedProspect !== null) || hasCustom) &&
    !outreachLoading

  return (
    <div className="space-y-4">
      {/* Your Company / KB */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            Your Company
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs text-muted-foreground">Knowledge base</Label>
          {kbFileName ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{kbFileName}</span>
              <span className="ml-auto shrink-0 text-xs">ready</span>
            </div>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={kbUploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFiles(e.dataTransfer.files)
            }}
            className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none ${
              dragOver
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            {kbUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span>
              {kbUploading
                ? 'Uploading & training...'
                : kbFileName
                  ? 'Replace document — drop a PDF/DOCX'
                  : 'Drop a PDF/DOCX describing your product, ICP & pricing'}
            </span>
          </button>
        </CardContent>
      </Card>

      {/* Target Company */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4 text-primary" />
            Target Company
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs text-muted-foreground">
            Company you want to sell into
          </Label>
          <Input
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            placeholder="e.g. Northwind Logistics"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && targetCompany.trim() && !researchLoading)
                onResearch()
            }}
          />
          <Button
            className="w-full active:scale-[0.98] transition-transform motion-reduce:transform-none"
            disabled={!targetCompany.trim() || researchLoading}
            onClick={onResearch}
          >
            {researchLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Research Company
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Prospects */}
      {(hasResearch || prospectLoading) && (
        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Prospects · pick one
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prospectLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(prospects) &&
                  prospects.map((p, i) => {
                    const active =
                      selectedProspect?.role === p.role &&
                      selectedProspect?.name === p.name
                    return (
                      <button
                        key={`${p.role}-${i}`}
                        type="button"
                        onClick={() => {
                          onSelectProspect(active ? null : p)
                          setCustomName('')
                          setCustomRole('')
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none ${
                          active
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-muted/40 hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {active && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          )}
                          {p.role ?? p.name ?? 'Prospect'}
                        </div>
                        {p.fit_reason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {p.fit_reason}
                          </p>
                        )}
                      </button>
                    )
                  })}
                {(!Array.isArray(prospects) || prospects.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    No prospects suggested — enter your own below.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserPlus className="h-3.5 w-3.5" />
                …or enter your own
              </Label>
              <Input
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value)
                  if (e.target.value) onSelectProspect(null)
                }}
                placeholder="Name (optional)"
              />
              <Input
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value)
                  if (e.target.value) onSelectProspect(null)
                }}
                placeholder="Role (optional)"
              />
            </div>

            <Button
              className="w-full active:scale-[0.98] transition-transform motion-reduce:transform-none"
              disabled={!canGenerate}
              onClick={onGenerateOutreach}
            >
              {outreachLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Outreach
                </>
              )}
            </Button>
            {!kbFileName && (
              <p className="text-xs text-muted-foreground">
                Upload your company knowledge base to enable outreach.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
