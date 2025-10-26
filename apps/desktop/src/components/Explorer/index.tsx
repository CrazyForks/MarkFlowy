import { Empty, FileTree, List } from '@/components'
import type { IFile } from '@/helper/filesys'
import { useOpen } from '@/hooks'
import { useEditorStore } from '@/stores'
import useOpenedCacheStore from '@/stores/useOpenedCacheStore'
import classNames from 'classnames'
import type { FC, MouseEventHandler } from 'react'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Popover } from 'zens'
import type { ListDataItem } from '../UI/List'
import { Container } from './styles'

const RecentListBottom = styled.div`
  padding: 8px;
  font-size: 0.7rem;
  cursor: pointer;
  text-align: center;

  &:hover {
    background-color: ${(props) => props.theme.tipsBgColor};
  }
`

const Explorer: FC<ExplorerProps> = (props) => {
  const { t } = useTranslation()
  const { folderData, activeId, addOpenedFile, setActiveId } = useEditorStore()
  const [popperOpen, setPopperOpen] = useState(false)
  const { recentWorkspaces, clearRecentWorkspaces } = useOpenedCacheStore()
  const { openFolderDialog, openFolder } = useOpen()
  const dndRootElementRef = useRef(null)

  const handleSelect = (item: IFile) => {
    if (item?.kind !== 'file') return

    addOpenedFile(item.id)
    setActiveId(item.id)
  }

  const handleClearRecent = () => {
    clearRecentWorkspaces()
    setPopperOpen(false)
  }

  const handleOpenHistoryListItemClick = useCallback(
    (item: ListDataItem) => {
      openFolder(item.title)
      setPopperOpen(false)
    },
    [openFolder],
  )

  const handleContextMenu: MouseEventHandler = useCallback((e) => e.preventDefault(), [])

  const listData = useMemo(
    () =>
      recentWorkspaces.map((history: { path: string }) => ({
        key: history.path,
        title: history.path,
        iconCls: 'ri-folder-5-line',
      })),
    [recentWorkspaces],
  )

  const containerCLs = classNames(props.className)

  return (
    <Container className={containerCLs} onContextMenu={handleContextMenu}>
      <div className='h-full w-full overflow-hidden' ref={dndRootElementRef}>
        {folderData && folderData.length > 0 ? (
          <FileTree
            data={folderData}
            activeId={activeId}
            onSelect={handleSelect}
            dndRootElement={dndRootElementRef.current as unknown as Node}
          />
        ) : (
          <Empty />
        )}
      </div>
      <div className='explorer-bottom'>
        <span className='explorer-bottom__action cursor-pointer' onClick={openFolderDialog}>
          {t('file.openDir')}
        </span>
        <Popover
          arrow
          fixed
          style={{ zIndex: 9999 }}
          open={popperOpen}
          onClose={() => setPopperOpen(false)}
          placement='top-end'
          customContent={
            <>
              <List
                title={t('file.recentDir')}
                data={listData}
                onItemClick={handleOpenHistoryListItemClick}
              />
              <RecentListBottom onClick={handleClearRecent}>Clear Recent</RecentListBottom>
            </>
          }
        >
          {listData.length > 0 ? (
            <i
              className='ri-more-2-fill explorer-bottom__action__icon'
              onClick={() => setPopperOpen(true)}
            />
          ) : null}
        </Popover>
      </div>
    </Container>
  )
}

interface ExplorerProps {
  className?: string
}

export default memo(Explorer)
