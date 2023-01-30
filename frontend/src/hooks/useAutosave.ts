import {useCallback, useEffect, useRef, useState} from "react";
import {useDebouncedCallback} from "use-debounce";
import {INPUT_DEBOUNCE_TIME, INPUT_DEFAULT_DELAY} from "../settings";
import {delay} from "../utilities/functions";


export default function useAutoSave(onSave: (value: any) => Promise<any>, callback: (value: any) => void) {
    const [queue, setQueue] = useState<{
        isProcessing: boolean
        dataValues: Array<any>
    }>({isProcessing: false, dataValues: []})

    const add = useCallback((value: any) => {
        setQueue((prev) => ({
            isProcessing: prev.isProcessing,
            dataValues: [...prev.dataValues, value],
        }))
    }, [])

    const debounce = useDebouncedCallback((value) => {
        add(value)
        callback(value)
    }, INPUT_DEBOUNCE_TIME);

    useEffect(() => {
        if (queue.dataValues.length === 0) return
        if (queue.isProcessing) return

        console.debug("Starting save countdown")
        delay(INPUT_DEFAULT_DELAY).then(() => {
            console.debug("Starting save")
            const latestData = queue.dataValues.at(-1)
            setQueue((prev) => ({
                isProcessing: true,
                dataValues: [],
            }))

            Promise.resolve(onSave(latestData))
                .then(()=>console.debug("Saved"))
                .catch(()=>console.debug("Something went wrong"))
                .finally(() => {
                    console.debug(queue.dataValues)
                setQueue((prev) => ({
                    isProcessing: false,
                    dataValues: prev.dataValues,
                }))
            })

        })

    }, [queue])

    return {
        debounce
    }
}