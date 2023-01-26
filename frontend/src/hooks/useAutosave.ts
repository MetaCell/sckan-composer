import {useRef} from "react";
import {useMachine} from "@xstate/react";
import {Machine} from "xstate";
import equals from "fast-deep-equal";


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

const DEFAULT_DELAY = 7500

const autoSaveMachine = Machine({
    id: "autoSaveMachine",
    initial: AutoSaveStates.Saved,
    states: {
        [AutoSaveStates.Saved]: {
            on: {
                [AutoSaveEvents.HasUnsavedData.toString()]: AutoSaveStates.WaitingToSave
            }
        },
        [AutoSaveStates.WaitingToSave]: {
            after: [
                {
                    delay: (_, payload) => payload.delay ?? DEFAULT_DELAY,
                    target: AutoSaveStates.ReadyToSave
                }
            ]
        },
        [AutoSaveStates.ReadyToSave]: {
            on:
                {
                    [AutoSaveEvents.SaveData.toString()]: AutoSaveStates.Saving
                }
        },
        [AutoSaveStates.Saving]: {
            invoke: {
                src: AutoSaveServices.save.toString(),
                onDone: AutoSaveStates.Saved,
                onError: AutoSaveStates.Error
            }
        },
        [AutoSaveStates.Error]: {
            on: {
                [AutoSaveEvents.Retry.toString()]: AutoSaveStates.ReadyToSave
            }
        },
    }
},
    {
        services: {
            [AutoSaveServices.save.toString()]: (ctx, payload) => {
                return payload.onSave(payload.data)
            }
        }

    })

export default function useAutoSave(onSave: (data: any) => Promise<any>, data: any, delay: number = DEFAULT_DELAY, forceSave: boolean = false) {
    const prevData = useRef(data)
    const [state, send] = useMachine(autoSaveMachine)
    if(!equals(prevData.current, data) || forceSave){
        send(AutoSaveEvents.HasUnsavedData.toString(), {delay})
    }
    prevData.current = data
    if(state.matches(AutoSaveStates.ReadyToSave)){
        send(AutoSaveEvents.SaveData.toString(), {onSave, data: prevData.current})
    }
    if(state.matches(AutoSaveStates.Error)){
        send(AutoSaveEvents.Retry.toString(), {delay})
    }
    return state.value
}