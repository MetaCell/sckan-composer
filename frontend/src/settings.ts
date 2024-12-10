import {LockIcon, RestartIcon, UnLockIcon, WarningIcon} from "./components/ProofingTab/GraphDiagram/Widgets/icons";

export const EDIT_DEBOUNCE = 120000 // 120 seconds
export const SEARCH_DEBOUNCE = 450 // 0.45 seconds
export const ROWS_PER_PAGE = 10 //number of records displayed at sentence and statement list

export const CONFIRMATION_DIALOG_CONFIG = {
  Locked: {
    title: 'Are you sure you want to unlock the diagram?',
    confirmationText: 'The diagram will revert to default routing for all users if it remains unlocked.',
    Icon: UnLockIcon
  },
  Unlocked: {
    title: 'Are you sure you want to lock the diagram?',
    confirmationText: 'This diagram will be displayed to all users.',
    Icon: LockIcon
  },
  Navigate: {
    title: 'Changes have been made.',
    confirmationText: 'The diagram will revert to default routing to match the Path Builder information.',
    Icon: WarningIcon
  },
  Redraw: {
    title: 'Are you sure you want to redraw the diagram?',
    confirmationText: 'The diagram will be redrawn using the default routing. Are you sure you’d like to proceed?',
    Icon: RestartIcon
  },
}
