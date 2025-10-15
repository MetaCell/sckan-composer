from enum import Enum


class ConnectivityErrors(Enum):
    INVALID_FORWARD_CONNECTION = "Invalid forward connection"


class BulkActionType(str, Enum):
    ASSIGN_USER = "assign_user"
    ASSIGN_TAG = "assign_tag"
    WRITE_NOTE = "write_note"
    CHANGE_STATUS = "change_status"
    ASSIGN_POPULATION_SET = "assign_population_set"
