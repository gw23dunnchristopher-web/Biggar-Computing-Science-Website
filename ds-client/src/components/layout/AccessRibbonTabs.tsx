/**
 * Shared ribbon tab content builders for the MS Access-style ribbon.
 * All views (Home, Table Datasheet, Table Design, Query Design) use these common tabs.
 */
import React from 'react';
import { RibbonGroup, RibbonButton } from './Ribbon';
import {
  Table, List, FileSpreadsheet, FileText, FileType,
  Settings, GitBranch, BarChart2, Wrench, Upload,
  PlugZap, FileDown, FileUp, Mail, Wand2, Download
} from 'lucide-react';

export interface CommonTabsProps {
  onCreateTable: () => void;
  onCreateQuery: () => void;
  onQueryWizard?: () => void;
  /** Form Wizard — guided step-by-step creation */
  onCreateForm?: () => void;
  /** Blank Form — creates a form with no fields selected, opens in Design View */
  onCreateBlankForm?: () => void;
  /** Auto Form — creates a form with all fields included, no wizard, opens in Form View */
  onCreateAutoForm?: () => void;
  /** Report Wizard — guided step-by-step creation */
  onCreateReport?: () => void;
  /** Blank Report — creates a report with no fields, opens in Report Design View */
  onCreateBlankReport?: () => void;
  /** Auto Report — creates a report with all fields, no wizard, opens in Report View */
  onCreateAutoReport?: () => void;
  onImportCSV?: () => void;
  onExportData?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onOpenSql?: () => void;
  onOpenRelationships?: () => void;
  onCompact?: () => void;
  onAnalyse?: () => void;
  onDocumenter?: () => void;
  onObjectDependencies?: () => void;
}

/** CREATE tab — Tables, Queries, Forms, Reports, Macros */
export function CreateTabContent({
  onCreateTable, onCreateQuery, onQueryWizard,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
}: CommonTabsProps) {
  return (
    <>
      <RibbonGroup name="Templates">
        <RibbonButton icon={<FileType size={22} />} label="Application Parts" disabled />
      </RibbonGroup>
      <RibbonGroup name="Tables">
        <RibbonButton icon={<Table size={22} />} label="Table" onClick={onCreateTable} />
        <RibbonButton icon={<Table size={22} />} label="Table Design" onClick={onCreateTable} />
        <RibbonButton icon={<FileSpreadsheet size={22} />} label="SharePoint Lists" disabled />
      </RibbonGroup>
      <RibbonGroup name="Queries">
        <RibbonButton icon={<Wand2 size={22} />} label="Query Wizard" onClick={onQueryWizard} disabled={!onQueryWizard} />
        <RibbonButton icon={<List size={22} />} label="Query Design" onClick={onCreateQuery} />
      </RibbonGroup>
      <RibbonGroup name="Forms">
        <RibbonButton
          icon={<Wand2 size={22} />}
          label="Form Wizard"
          onClick={onCreateForm}
          disabled={!onCreateForm}
          title="Guided step-by-step form creation — choose table, fields and layout"
        />
        <RibbonButton
          icon={<FileText size={22} />}
          label="Blank Form"
          onClick={onCreateBlankForm}
          disabled={!onCreateBlankForm}
          title="Create an empty form with no fields — add them in Design View"
        />
        <RibbonButton
          icon={<FileText size={22} />}
          label="Auto Form"
          onClick={onCreateAutoForm}
          disabled={!onCreateAutoForm}
          title="Instantly create a form with all fields from a table — no wizard needed"
        />
      </RibbonGroup>
      <RibbonGroup name="Reports">
        <RibbonButton
          icon={<Wand2 size={22} />}
          label="Report Wizard"
          onClick={onCreateReport}
          disabled={!onCreateReport}
          title="Guided step-by-step report creation — choose fields, grouping and sorting"
        />
        <RibbonButton
          icon={<BarChart2 size={22} />}
          label="Report Design"
          onClick={onCreateBlankReport}
          disabled={!onCreateBlankReport}
          title="Create an empty report with no fields — add them in Design View"
        />
        <RibbonButton
          icon={<BarChart2 size={22} />}
          label="Auto Report"
          onClick={onCreateAutoReport}
          disabled={!onCreateAutoReport}
          title="Instantly create a report with all fields from a table — no wizard needed"
        />
      </RibbonGroup>
      <RibbonGroup name="Macros &amp; Code">
        <RibbonButton icon={<PlugZap size={22} />} label="Macro" disabled />
        <RibbonButton icon={<FileText size={22} />} label="Module" disabled />
      </RibbonGroup>
    </>
  );
}

/** EXTERNAL DATA tab — Import & Link, Export */
export function ExternalDataTabContent({ onImportCSV, onExportData, onShare }: CommonTabsProps) {
  return (
    <>
      <RibbonGroup name="Import &amp; Link">
        <RibbonButton icon={<FileSpreadsheet size={22} />} label="Excel" onClick={onImportCSV} disabled={!onImportCSV} />
        <RibbonButton icon={<Table size={22} />} label="Access" disabled />
        <RibbonButton icon={<FileUp size={22} />} label="Import CSV" onClick={onImportCSV} disabled={!onImportCSV} />
        <RibbonButton icon={<PlugZap size={22} />} label="ODBC Database" disabled />
      </RibbonGroup>
      <RibbonGroup name="Export">
        <RibbonButton icon={<FileSpreadsheet size={22} />} label="Excel" onClick={onExportData} disabled={!onExportData} />
        <RibbonButton icon={<FileDown size={22} />} label="Text File (CSV)" onClick={onExportData} disabled={!onExportData} />
        <RibbonButton icon={<Mail size={22} />} label="Email" disabled />
        <RibbonButton icon={<Upload size={22} />} label="Embed / Share" onClick={onShare} disabled={!onShare} />
      </RibbonGroup>
      <RibbonGroup name="Collect Data">
        <RibbonButton icon={<Mail size={22} />} label="Create Email" disabled />
      </RibbonGroup>
    </>
  );
}

/** DATABASE TOOLS tab */
export function DatabaseToolsTabContent({
  onSettings, onOpenSql, onOpenRelationships,
  onCompact, onAnalyse, onDocumenter, onObjectDependencies,
}: CommonTabsProps) {
  return (
    <>
      <RibbonGroup name="Tools">
        <RibbonButton icon={<Wrench size={22} />} label="Compact &amp; Repair" onClick={onCompact} disabled={!onCompact} />
        <RibbonButton icon={<PlugZap size={22} />} label="Visual Basic" disabled />
        <RibbonButton icon={<PlugZap size={22} />} label="Run Macro" disabled />
      </RibbonGroup>
      <RibbonGroup name="Relationships">
        <RibbonButton icon={<GitBranch size={22} />} label="Relationships" onClick={onOpenRelationships} disabled={!onOpenRelationships} />
        <RibbonButton icon={<GitBranch size={22} />} label="Object Dependencies" onClick={onObjectDependencies} disabled={!onObjectDependencies} />
      </RibbonGroup>
      <RibbonGroup name="Analyse">
        <RibbonButton icon={<BarChart2 size={22} />} label="Analyse Table" onClick={onAnalyse} disabled={!onAnalyse} />
        <RibbonButton icon={<FileText size={22} />} label="Database Documenter" onClick={onDocumenter} disabled={!onDocumenter} />
      </RibbonGroup>
      <RibbonGroup name="Database Settings">
        <RibbonButton icon={<Settings size={22} />} label="Settings" onClick={onSettings} disabled={!onSettings} />
      </RibbonGroup>
    </>
  );
}
