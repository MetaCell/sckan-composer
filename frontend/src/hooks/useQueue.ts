import {useCallback, useEffect, useState} from "react";

type Task = () => Promise<void> | void

export default function useQueue(): {
    tasks: ReadonlyArray<Task>
    isProcessing: boolean
    addTask: (task: Task) => void
} {
    const [queue, setQueue] = useState<{
        isProcessing: boolean
        tasks: Array<Task>
    }>({isProcessing: false, tasks: []})

    useEffect(() => {
        if (queue.tasks.length === 0) return
        if (queue.isProcessing) return

        const nextTask = queue.tasks[0]
        setQueue((prev) => ({
            isProcessing: true,
            tasks: prev.tasks.slice(1),
        }))

        Promise.resolve(nextTask()).finally(() => {
            setQueue((prev) => ({
                isProcessing: false,
                tasks: prev.tasks,
            }))
        })
    }, [queue])

    return {
        tasks: queue.tasks,
        isProcessing: queue.isProcessing,
        addTask: useCallback((task) => {
            setQueue((prev) => ({
                isProcessing: prev.isProcessing,
                tasks: [...prev.tasks, task],
            }))
        }, []),
    }
}

