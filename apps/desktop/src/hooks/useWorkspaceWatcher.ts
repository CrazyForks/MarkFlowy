import { getWorkspace, WorkSpace } from '@/services/workspace'
import { useEditorStore } from '@/stores'
import { invoke } from '@tauri-apps/api/core'
import { createGlobalStore } from 'hox'
import { useEffect } from 'react'
import { create } from 'zustand'

export const useWorkspaceStore = create<WorkSpaceStore>((set) => {
  return {
    workspace: null,
    setWorkspace: (ws) => {
      set(() => {
        return {
          workspace: ws,
        }
      })
    },
  }
})

interface WorkSpaceStore {
  workspace: WorkSpace | null
  setWorkspace: (ws: WorkSpace | null) => void
}

const useWorkspaceWatcher = () => {
  const { folderData } = useEditorStore()
  const { setWorkspace } = useWorkspaceStore()

  const rootPath = folderData?.[0]?.path

  useEffect(() => {
    getWorkspace().then((ws) => setWorkspace(ws))

    const setupWatcher = async () => {
      try {
        await invoke('stop_file_watcher', {
          key: 'workspace',
        })
      } catch (error) {}

      console.log('rootPath', rootPath)
      if (rootPath) {
        invoke('watch_file', {
          key: 'workspace',
          path: rootPath,
        })
      }
    }

    setupWatcher()

    return () => {
      invoke('stop_file_watcher', {
        key: 'workspace',
      })
    }
  }, [rootPath])
}
const [useGlobalKeyboard] = createGlobalStore(useWorkspaceWatcher)

export default useGlobalKeyboard
