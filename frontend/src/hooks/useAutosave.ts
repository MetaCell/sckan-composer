import {useCallback, useEffect, useRef, useState} from "react";
import {useDebouncedCallback} from "use-debounce";
import {AUTOSAVE_TIMEOUT, INPUT_DEBOUNCE_TIME, INPUT_DEFAULT_DELAY} from "../settings";
import {delay} from "../utilities/functions";


export default function useAutoSave(onSave: (value: any) => any, debouncedCallback: (value: any) => void) {
    const latestDataRef = useRef<any|null>(null);
    const setLatestDataInQueue = (value: any) => {latestDataRef.current = value}
    const latestData = latestDataRef.current
    // const timoutRef = useRef<any|null>(null);
    const [isWaitingToSave, setIsWaitingToSave] = useState<boolean>(false)
    const [queue, setQueue] = useState<{
        isProcessing: boolean
        length: number
    }>({isProcessing: false, length: 0})
    // Updates the autosave data to the latest edit
    const updateData = useCallback((value: any) => {
        console.debug("Updated autosave data to: " + value.title)
        setLatestDataInQueue(value)
        if(!isWaitingToSave){
            setQueue((prev) => ({
                isProcessing: prev.isProcessing,
                length: Math.min(prev.length + 1, 2) ,
            }))
        }
    }, [])

    // Debounces form changes by @INPUT_DEBOUNCE_TIME milliseconds
    const debounce = useDebouncedCallback((value) => {
        updateData(value)
        debouncedCallback(value)
    }, INPUT_DEBOUNCE_TIME);

    // Processes data saving
    useEffect(() => {
        if(queue.isProcessing) return;
        if(queue.length == 0) return;
        if (latestData === null) return;
        setQueue((prev) => ({
            isProcessing: true,
            length: prev.length,
        }))
        setIsWaitingToSave(true)
        // Waits @INPUT_DEFAULT_DELAY milliseconds before committing the latest changes
        console.debug("Started saving process...")
        delay(INPUT_DEFAULT_DELAY).then(() => {
            console.debug("Saving")
            setIsWaitingToSave(false)
            // Synchronous call to form onSave function
            // Ideally would be asynchronous and all the logic would be contained in the hook but rjsf programmatically
            // form submits rely on events
            onSave(latestData)
            // TODO: Make sure we want this, if a response comes after @AUTOSAVE_TIMEOUT we may be canceling
            // a different save
            // timoutRef.current = setTimeout(() => resolve(), AUTOSAVE_TIMEOUT);

            })
        },[queue])

/*    function cancelTimeout() {
        clearTimeout(timoutRef.current)
        timoutRef.current = null
    }*/

// Exposes setIsProcessing to the form so that we can be notified when the onSave promise is over
    const resolve = () => {
        console.debug("Saving Stopped (either successfully or with errors)")
        setQueue((prev) => ({
            isProcessing: false,
            length: prev.length - 1,
        }))
        // cancelTimeout();
    }

    return {
        debounce,
        resolve
    }
}