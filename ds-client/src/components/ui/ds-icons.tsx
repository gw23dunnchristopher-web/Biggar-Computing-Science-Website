interface DsIconProps {
  size?: number;
  className?: string;
}

function icon(file: string) {
  return function DsIcon({ size = 22, className }: DsIconProps) {
    return (
      <img
        src={`/icons/${file}`}
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
export const DsRelationshipsIcon    = icon('relationships.svg');
export const DsRemoveSortIcon       = icon('removeSort.svg');
export const DsReportsBlankReportIcon  = icon('reportsBlankReport.svg');
export const DsReportsLabelsIcon    = icon('reportsLabels.svg');
export const DsReportsReportIcon    = icon('reportsReport.svg');
export const DsReportsReportDesignIcon = icon('reportsReportDesign.svg');
export const DsReportsReportWizardIcon = icon('reportsReportWizard.svg');
export const DsSelectionIcon        = icon('Selection.svg');
export const DsTableIcon            = icon('table.svg');
export const DsTablesTableDesignIcon = icon('tablesTableDesign.svg');
export const DsToggleFilterIcon     = icon('toggleFilter.svg');
