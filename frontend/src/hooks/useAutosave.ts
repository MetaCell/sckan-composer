import {useCallback, useRef, useState} from "react";
import {useMachine} from "@xstate/react";
import {createMachine} from "xstate/lib/Machine";
import useQueue from "./useQueue";
import {useDebouncedCallback} from "use-debounce";
import {INPUT_DEBOUNCE_TIME} from "../settings";
import {isEmpty} from "../utilities/functions";


export enum AutoSaveStates {
    Saved = "Saved",
    WaitingToSave = "WaitingToSave",
    ReadyToSave = "ReadyToSave",
    Saving = "Saving",
    Error = "Error",
}

enum AutoSaveEvents {
    HasUnsavedData,
    SaveData,
    Retry
}

enum AutoSaveServices {
    save
}

const DEFAULT_DELAY = 30000

type Task = (value: any) => Promise<any>

export default function useAutoSave(resolve: Task, callback: (value: any) => void) {

    const [queue, setQueue] = useState<Array<Task>>([])

    const addTask = useCallback((task: Task) => {
        setQueue((prev) => ([...prev, task]))
    }, [])

    const debounce = useDebouncedCallback((value) => {
            addTask(() =>resolve(value))
            callback(value)
    }, INPUT_DEBOUNCE_TIME);

    console.log(queue.length)
    return {
        debounce
    }
}