interface DsIconProps {
  size?: number;
  className?: string;
}

function icon(file: string) {
  return function DsIcon({ size = 22, className }: DsIconProps) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}icons/${file}`}
        width={size}
        height={size}
        className={className}
        alt=""
        draggable={false}
        style={{ display: 'inline-block', flexShrink: 0 }}
      />
    );
  };
}

export const DsAdvancedFilterIcon   = icon('AdvancedFilter.svg');
export const DsAscendingIcon        = icon('ascending.svg');
export const DsDatasheetIcon        = icon('Datasheet.svg');
export const DsDescendingIcon       = icon('descending.svg');
export const DsDesignIcon           = icon('Design.svg');
export const DsFilterIcon           = icon('Filter.svg');
export const DsFindGoToIcon         = icon('findGoTo.svg');
export const DsFindReplaceIcon      = icon('findReplace.svg');
export const DsFindSelectIcon       = icon('findSelect.svg');
export const DsFindIcon             = icon('find.svg');
export const DsFormsBlankFormIcon   = icon('formsBlankForm.svg');
export const DsFormsFormIcon        = icon('formsForm.svg');
export const DsFormsFormDesignIcon  = icon('formsFormDesign.svg');
export const DsFormsFormWizardIcon  = icon('formsFormWizard.svg');
export const DsFormsMoreFormsIcon   = icon('formsMoreForms.svg');
export const DsFormsNavigationIcon  = icon('formsNavigation.svg');
export const DsQueriesQueryWizardIcon = icon('queriesQueryWizard.svg');
export const DsQueriesSQLQueryIcon  = icon('queriesSQLQuery.svg');
export const DsRecordsDeleteIcon    = icon('recordsDelete.svg');
export const DsRecordsMoreIcon      = icon('recordsMore.svg');
export const DsRecordsNewIcon       = icon('recordsNew.svg');
export const DsRecordsSaveIcon      = icon('recordsSave.svg');
export const DsRecordsSpellingIcon  = icon('recordsSpelling.svg');
export const DsRecordsTotalsIcon    = icon('recordsTotals.svg');
export const DsRefreshAllIcon       = icon('RefreshAll.svg');
export const DsAnalyzePerformanceIcon        = icon('analyzeAnalyzePerformance.svg');
export const DsAnalyzeTableIcon              = icon('analyzeAnalyzeTable.svg');
export const DsAnalyzeDatabaseDocumenterIcon = icon('analyzeDatabaseDocumenter.svg');
export const DsObjectDependenciesIcon        = icon('relationshipsObjectDependencies.svg');
export const DsCompactAndRepairIcon          = icon('toolsCompactAndRepairDatabase.svg');
export const DsRelationshipsIcon             = icon('relationships.svg');
export const DsRemoveSortIcon                = icon('removeSort.svg');
export const DsToolsPrimaryKeyIcon           = icon('toolsPrimaryKey.svg');
export const DsToolsTestValidationRulesIcon  = icon('toolsTestValidationRules.svg');
export const DsToolsModifyLookupsIcon        = icon('toolsModifyLookups.svg');
export const DsReportsBlankReportIcon  = icon('reportsBlankReport.svg');
export const DsReportsLabelsIcon    = icon('reportsLabels.svg');
export const DsReportsReportIcon    = icon('reportsReport.svg');
export const DsImportLinkNewDataSourceIcon    = icon('importLinkNewDataSource.svg');
export const DsImportLinkSavedImportsIcon     = icon('importLinkSavedImports.svg');
export const DsImportLinkLinkedTableManagerIcon = icon('importLinkLinkedTableManager.svg');
export const DsExportsSavedExportsIcon        = icon('exportsSavedExports.svg');
export const DsExportsExcelIcon               = icon('exportsExcel.svg');
export const DsExportsTextFileIcon            = icon('exportsTextFile.svg');
export const DsExportsPDFOrXPSIcon            = icon('exportsPDForXPS.svg');
export const DsReportsReportDesignIcon = icon('reportsReportDesign.svg');
export const DsReportsReportWizardIcon = icon('reportsReportWizard.svg');
export const DsSelectionIcon        = icon('Selection.svg');
export const DsTableIcon            = icon('table.svg');
export const DsTablesTableDesignIcon = icon('tablesTableDesign.svg');
export const DsToggleFilterIcon     = icon('toggleFilter.svg');

// ── Query Type icons ──────────────────────────────────────────────────────────
export const DsQueryTypeSelectIcon         = icon('queryTypeSelect.svg');
export const DsQueryTypeMakeTableIcon      = icon('queryTypeMakeTable.svg');
export const DsQueryTypeAppendIcon         = icon('QueryTypeAppend.svg');
export const DsQueryTypeUpdateIcon         = icon('queryTypeUpdate.svg');
export const DsQueryTypeDeleteIcon         = icon('queryTypeDelete.svg');
export const DsQueryTypeCrosstabIcon       = icon('queryTypeCrosstab.svg');
export const DsQueryTypeUnionIcon          = icon('queryTypeUnion.svg');
export const DsQueryTypePassThroughIcon    = icon('queryTypePass-Through.svg');
export const DsQueryTypeDataDefinitionIcon = icon('queryTypeDataDefinition.svg');

// ── Query Setup icons ─────────────────────────────────────────────────────────
export const DsQuerySetupAddTablesIcon      = icon('querySetupAddTables.svg');
export const DsQuerySetupBuilderIcon        = icon('querySetupBuilder.svg');
export const DsQuerySetupDeleteColumnsIcon  = icon('querySetupDeleteColumns.svg');
export const DsQuerySetupDeleteReturnIcon   = icon('querySetupDeleteReturn.svg');
export const DsQuerySetupDeleteRowsIcon     = icon('querySetupDeleteRows.svg');
export const DsQuerySetupInsertColumnsIcon  = icon('querySetupInsertColumns.svg');
export const DsQuerySetupInsertRowsIcon     = icon('querySetupInsertRows.svg');

// ── Show/Hide icons ───────────────────────────────────────────────────────────
export const DsShowHideParametersIcon    = icon('showHideParameters.svg');
export const DsShowHidePropertySheetIcon = icon('showHidePropertySheet.svg');
export const DsShowHideTableNamesIcon    = icon('showHideTableNames.svg');
export const DsShowHideTotalsIcon        = icon('showHideTotals.svg');
