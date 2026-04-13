/**
 * Shared ribbon tab content builders for the MS Access-style ribbon.
 * All views (Home, Table Datasheet, Table Design, Query Design) use these common tabs.
 */
import React from 'react';
import { RibbonGroup, RibbonButton } from './Ribbon';
import {
  Settings, Upload,
} from 'lucide-react';
import {
  DsTableIcon, DsTablesTableDesignIcon,
  DsQueriesQueryWizardIcon, DsQueriesSQLQueryIcon,
  DsFormsFormWizardIcon, DsFormsBlankFormIcon, DsFormsFormIcon,
  DsReportsReportWizardIcon, DsReportsReportDesignIcon, DsReportsReportIcon,
  DsRelationshipsIcon,
  DsAnalyzePerformanceIcon, DsAnalyzeTableIcon, DsAnalyzeDatabaseDocumenterIcon,
  DsObjectDependenciesIcon, DsCompactAndRepairIcon,
  DsImportLinkNewDataSourceIcon, DsImportLinkSavedImportsIcon, DsImportLinkLinkedTableManagerIcon,
  DsExportsSavedExportsIcon, DsExportsExcelIcon, DsExportsTextFileIcon, DsExportsPDFOrXPSIcon,
} from '@/components/ui/ds-icons';

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
  onCreateSqlQuery?: () => void;
  onCompact?: () => void;
  onAnalyse?: () => void;
  onDocumenter?: () => void;
  onObjectDependencies?: () => void;
}

/** CREATE tab — Tables, Queries, Forms, Reports */
export function CreateTabContent({
  onCreateTable, onCreateQuery, onQueryWizard, onCreateSqlQuery,
  onCreateForm, onCreateBlankForm, onCreateAutoForm,
  onCreateReport, onCreateBlankReport, onCreateAutoReport,
}: CommonTabsProps) {
  return (
    <>
      <RibbonGroup name="Tables">
        <RibbonButton icon={<DsTableIcon size={40} />} label="Table" onClick={onCreateTable} />
        <RibbonButton icon={<DsTablesTableDesignIcon size={32} />} label="Table Design" onClick={onCreateTable} />
      </RibbonGroup>
      <RibbonGroup name="Queries">
        <RibbonButton icon={<DsQueriesQueryWizardIcon size={32} />} label="Query Wizard" onClick={onQueryWizard} disabled={!onQueryWizard} />
        <RibbonButton icon={<DsQueriesQueryWizardIcon size={32} />} label="Query Design" onClick={onCreateQuery} />
        <RibbonButton icon={<DsQueriesSQLQueryIcon size={32} />} label="SQL Query" onClick={onCreateSqlQuery} disabled={!onCreateSqlQuery} title="Open SQL view" />
      </RibbonGroup>
      <RibbonGroup name="Forms">
        <RibbonButton
          icon={<DsFormsFormWizardIcon size={32} />}
          label="Form Wizard"
          onClick={onCreateForm}
          disabled={!onCreateForm}
          title="Guided step-by-step form creation — choose table, fields and layout"
        />
        <RibbonButton
          icon={<DsFormsBlankFormIcon size={32} />}
          label="Blank Form"
          onClick={onCreateBlankForm}
          disabled={!onCreateBlankForm}
          title="Create an empty form with no fields — add them in Design View"
        />
        <RibbonButton
          icon={<DsFormsFormIcon size={32} />}
          label="Auto Form"
          onClick={onCreateAutoForm}
          disabled={!onCreateAutoForm}
          title="Instantly create a form with all fields from a table — no wizard needed"
        />
      </RibbonGroup>
      <RibbonGroup name="Reports">
        <RibbonButton
          icon={<DsReportsReportWizardIcon size={32} />}
          label="Report Wizard"
          onClick={onCreateReport}
          disabled={!onCreateReport}
          title="Guided step-by-step report creation — choose fields, grouping and sorting"
        />
        <RibbonButton
          icon={<DsReportsReportDesignIcon size={32} />}
          label="Report Design"
          onClick={onCreateBlankReport}
          disabled={!onCreateBlankReport}
          title="Create an empty report with no fields — add them in Design View"
        />
        <RibbonButton
          icon={<DsReportsReportIcon size={32} />}
          label="Auto Report"
          onClick={onCreateAutoReport}
          disabled={!onCreateAutoReport}
          title="Instantly create a report with all fields from a table — no wizard needed"
        />
      </RibbonGroup>
    </>
  );
}

/** EXTERNAL DATA tab — Import & Link, Export */
export function ExternalDataTabContent({ onImportCSV, onExportData, onShare }: CommonTabsProps) {
  return (
    <>
      <RibbonGroup name="Import &amp; Link">
        <RibbonButton icon={<DsImportLinkNewDataSourceIcon size={40} />} label="New Data Source" onClick={onImportCSV} disabled={!onImportCSV} />
        <RibbonButton icon={<DsImportLinkSavedImportsIcon size={32} />} label="Saved Imports" disabled />
        <RibbonButton icon={<DsImportLinkLinkedTableManagerIcon size={32} />} label="Linked Table Manager" disabled />
      </RibbonGroup>
      <RibbonGroup name="Export">
        <RibbonButton icon={<DsExportsSavedExportsIcon size={32} />} label="Saved Exports" disabled />
        <RibbonButton icon={<DsExportsExcelIcon size={40} />} label="Excel" onClick={onExportData} disabled={!onExportData} />
        <RibbonButton icon={<DsExportsTextFileIcon size={40} />} label="Text File" onClick={onExportData} disabled={!onExportData} />
        <RibbonButton icon={<DsExportsPDFOrXPSIcon size={40} />} label="PDF or XPS" disabled />
        <RibbonButton icon={<Upload size={32} />} label="Embed / Share" onClick={onShare} disabled={!onShare} />
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
        <RibbonButton icon={<DsCompactAndRepairIcon size={32} />} label="Compact and Repair Database" onClick={onCompact} disabled={!onCompact} wide />
      </RibbonGroup>
      <RibbonGroup name="Relationships">
        <RibbonButton icon={<DsRelationshipsIcon size={40} />} label="Relationships" onClick={onOpenRelationships} disabled={!onOpenRelationships} />
        <RibbonButton icon={<DsObjectDependenciesIcon size={32} />} label="Object Dependencies" onClick={onObjectDependencies} disabled={!onObjectDependencies} wide />
      </RibbonGroup>
      <RibbonGroup name="Analyse">
        <RibbonButton icon={<DsAnalyzeDatabaseDocumenterIcon size={32} />} label="Database Documenter" onClick={onDocumenter} disabled={!onDocumenter} wide />
        <RibbonButton icon={<DsAnalyzePerformanceIcon size={32} />} label="Analyze Performance" disabled wide />
        <RibbonButton icon={<DsAnalyzeTableIcon size={32} />} label="Analyse Table" onClick={onAnalyse} disabled={!onAnalyse} />
      </RibbonGroup>
      <RibbonGroup name="Database Settings">
        <RibbonButton icon={<Settings size={40} />} label="Settings" onClick={onSettings} disabled={!onSettings} />
      </RibbonGroup>
    </>
  );
}
