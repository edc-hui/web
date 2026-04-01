import { BulbOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import type { ModalProps } from 'antd'
import { Button, Modal, Popover, Spin, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { type DigitalHumanSkill, getEnabledSkills, installSkill } from '@/apis'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useListService } from '@/hooks/useListService'

const SKILL_ICON_BACKGROUNDS = [
  '#39A835',
  '#2172C0',
  '#1D1C52',
  '#64BEB7',
  '#6CA016',
  '#227F96',
  '#A3E034',
  '#45C5E4',
  '#10A5B7',
  '#1B669C',
  '#55A54E',
  '#A46E37',
]

function hashSkillName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function skillIconLabel(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  if (t.length <= 2) return t.toUpperCase()
  return t.slice(0, 2).toUpperCase()
}

function skillIconBackground(name: string): string {
  return SKILL_ICON_BACKGROUNDS[hashSkillName(name) % SKILL_ICON_BACKGROUNDS.length]
}

export interface SelectSkillModalProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  /** 在列表中点击「添加」或「已添加」时立即回传当前已选技能（不再使用底部确定） */
  onOk: (result: DigitalHumanSkill[]) => void
  onCancel: () => void
  onSubmit: (payload?: AiPromptSubmitPayload) => void
  /** 已选中的技能目录名（与 store `skills` / API 一致） */
  defaultSelectedSkills?: DigitalHumanSkill[]
  /** 当前数字员工 ID；有值时「我的技能」拉取该员工已配置技能 */
  digitalHumanId?: string
  /** 外部触发刷新列表的信号 */
  refreshToken?: number
  /** 是否展示弹窗遮罩 */
  showMask?: boolean
}

type SkillMenu = 'platform' | 'mine'

const navItemCls =
  'mb-1 flex h-9 w-full items-center gap-2 rounded-lg border-0 px-3 py-2 text-left transition-colors hover:bg-[var(--dip-hover-bg-color-4)]'

const SelectSkillModal = ({
  open,
  onOk,
  onCancel,
  onSubmit,
  defaultSelectedSkills = [],
  digitalHumanId,
  refreshToken = 0,
  showMask = true,
}: SelectSkillModalProps) => {
  const [selectedSkills, setSelectedSkills] = useState<DigitalHumanSkill[]>([])
  const [menu, setMenu] = useState<SkillMenu>('platform')
  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([])
  const [messageApi, messageContextHolder] = message.useMessage()

  const {
    items: allSkills,
    loading,
    error,
    fetchList: fetchAllSkills,
  } = useListService<DigitalHumanSkill>({
    fetchFn: getEnabledSkills,
    autoLoad: false,
  })

  useEffect(() => {
    if (!open) return
    setSelectedSkills([...defaultSelectedSkills])
    setMenu('platform')
  }, [open, defaultSelectedSkills])

  useEffect(() => {
    if (!open) return
    void fetchAllSkills()
  }, [open, refreshToken, fetchAllSkills])

  const platformSkills = useMemo(
    () => allSkills.filter((item) => item.type !== 'agents-skills-personal'),
    [allSkills],
  )
  const mySkills = useMemo(
    () => allSkills.filter((item) => item.type === 'agents-skills-personal'),
    [allSkills],
  )

  const displayList = useMemo(() => {
    return menu === 'platform' ? platformSkills : mySkills
  }, [menu, platformSkills, mySkills])

  const listError = error

  const selectedCount = selectedSkills.length

  const handleUploadLocalSkill = async () => {
    const file = uploadFileList[0]?.originFileObj
    if (!file) {
      messageApi.warning('请先选择技能包文件')
      return
    }
    try {
      setUploading(true)
      await installSkill({ file })
      messageApi.success('上传并安装成功')
      setUploadModalOpen(false)
      setUploadFileList([])
      void fetchAllSkills()
    } catch (error: any) {
      messageApi.error(error?.description || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const createSkillPopoverContent = (
    <div className="flex w-[260px] gap-3 p-1">
      <button
        type="button"
        className="flex-1 rounded-xl border border-[--dip-border-color] bg-[var(--dip-white)] px-3 py-3 text-center hover:bg-[var(--dip-hover-bg-color)] transition-colors"
        onClick={() => {
          setShowCreateEntryModal(false)
          setUploadModalOpen(true)
        }}
      >
        <IconFont type="icon-upload" className="text-base text-[--dip-text-color-45] mb-2" />
        <p className="mb-1 text-[--dip-text-color]">本地上传</p>
        <p className="m-0 text-xs text-[--dip-text-color-45]">支持 .zip 格式</p>
      </button>
      <button
        type="button"
        className="flex-1 rounded-xl border border-[--dip-border-color] bg-[var(--dip-white)] px-3 py-3 text-center hover:bg-[var(--dip-hover-bg-color)] transition-colors"
        onClick={() => {
          setShowCreateEntryModal(false)
          handleSubmit()
        }}
      >
        <IconFont type="icon-upload" className="text-base text-[--dip-text-color-45] mb-2" />
        <p className="mb-1 text-[--dip-text-color]">AI 开发</p>
        <p className="m-0 text-xs text-[--dip-text-color-45]">支持 AI 开发</p>
      </button>
    </div>
  )

  const toggleSelect = (skill: DigitalHumanSkill) => {
    setSelectedSkills((prev) => {
      const exists = prev.some((x) => x.name === skill.name)
      if (exists) {
        const next = prev.filter((x) => x.name !== skill.name)
        queueMicrotask(() => onOk(next))
        return next
      }
      const next = [...prev, skill]
      queueMicrotask(() => onOk(next))
      return next
    })
  }

  const handleSubmit = (payload?: AiPromptSubmitPayload) => {
    onSubmit(payload)
  }

  const renderStateContent = () => {
    if (loading) {
      return <Spin />
    }

    if (listError) {
      return <Empty type="failed" title={typeof listError === 'string' ? listError : '加载失败'} />
    }

    if (menu === 'mine' && !digitalHumanId) {
      return <Empty title="暂无数据" desc="可以点击【创建技能】创建或上传技能" />
    }

    if (displayList.length === 0) {
      return <Empty title="暂无技能" />
    }

    return null
  }

  const renderSkillRows = () => {
    return (
      <div className="bg-[#F8F8F7]">
        {displayList.map((item, index) => {
          const isAdded = selectedSkills.some((x) => x.name === item.name)
          return (
            <div key={item.name} className="flex flex-col">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-center text-[11px] font-semibold leading-tight text-white"
                  style={{ backgroundColor: skillIconBackground(item.name) }}
                >
                  {skillIconLabel(item.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 flex items-center gap-2 break-words text-sm font-bold leading-[22px]">
                    <span className="truncate">{item.name}</span>
                  </p>
                  <p
                    className="m-0 whitespace-pre-wrap break-words text-xs line-clamp-2 leading-5 text-[#6A7282]"
                    title={item.description?.trim()}
                  >
                    {item.description?.trim() || '--'}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  {isAdded ? (
                    <button
                      type="button"
                      className="h-7 min-w-16 cursor-pointer rounded-md border border-[--dip-border-color] bg-[] px-3 text-[13px] leading-5 text-[--dip-text-color-45] transition-colors hover:bg-[var(--dip-hover-bg-color)]"
                      title="点击取消选择"
                      onClick={() => toggleSelect(item)}
                    >
                      已添加
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-7 min-w-16 rounded-md border border-[--dip-border-color] bg-[--dip-white] px-3 text-[13px] leading-5 text-[--dip-text-color-85] transition-colors hover:bg-[var(--dip-hover-bg-color)]"
                      onClick={() => toggleSelect(item)}
                    >
                      添加
                    </button>
                  )}
                </div>
              </div>
              {index !== displayList.length - 1 && (
                <div className="h-px bg-[--dip-line-color-10] ml-[76px] flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderListBody = () => {
    const stateContent = renderStateContent()
    if (stateContent) {
      return <div className="flex h-full items-center justify-center mb-16">{stateContent}</div>
    }
    return renderSkillRows()
  }

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      width={960}
      centered
      closable={false}
      mask={{ closable: false, enabled: showMask }}
      destroyOnHidden
      footer={null}
      styles={{
        container: {
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '0',
        },
        body: {
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        },
      }}
    >
      {messageContextHolder}
      <div className="flex min-h-0 min-w-0 w-full flex-1 overflow-hidden">
        <aside className="flex w-[220px] shrink-0 flex-col self-stretch border-r border-[#E5E7EB] py-5 px-3 bg-[#F5F5F4]">
          <h2 className="mb-1 mt-0 text-base font-semibold leading-6 text-[--dip-text-color-85] px-2">
            编程技能
          </h2>
          <p className="mb-4 mt-0 text-xs leading-5 text-[--dip-text-color-45] px-2">Skills</p>
          <Popover
            trigger="click"
            placement="bottomLeft"
            arrow={false}
            open={showCreateEntryModal}
            onOpenChange={setShowCreateEntryModal}
            content={createSkillPopoverContent}
          >
            <button
              type="button"
              className="mx-2 mb-4 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[var(--dip-white)] px-3 text-[13px] leading-[22px] text-[--dip-text-color-85] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-[var(--dip-hover-bg-color)]"
            >
              <IconFont type="icon-add" className="text-base" />
              创建技能
            </button>
          </Popover>
          <button
            type="button"
            className={clsx(
              navItemCls,
              menu === 'platform' && 'bg-[#E5E6EB] !hover:bg-[#E5E6EB] font-medium',
            )}
            onClick={() => setMenu('platform')}
          >
            <BulbOutlined className="text-base" />
            平台技能
          </button>
          <button
            type="button"
            className={clsx(
              navItemCls,
              menu === 'mine' && 'bg-[#E5E6EB] !hover:bg-[#E5E6EB] font-medium',
            )}
            onClick={() => setMenu('mine')}
          >
            <UserOutlined className="text-base" />
            我的技能
          </button>
        </aside>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden py-5">
          <div className="mb-4 flex shrink-0 items-center gap-3 px-6">
            <h3 className="m-0 text-base font-semibold leading-6 text-[--dip-text-color-85]">
              技能列表
            </h3>
            <p className="m-0 text-xs leading-5 text-[--dip-text-color-45]">
              已选 {selectedCount}/{displayList.length}
            </p>
            <button
              type="button"
              className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[--dip-text-color-45] transition-colors hover:bg-[var(--dip-hover-bg-color-4)] hover:text-[--dip-text-color-85]"
              aria-label="关闭"
              onClick={onCancel}
            >
              <CloseOutlined />
            </button>
          </div>
          <ScrollBarContainer className="relative flex min-h-0 flex-1 flex-col px-6 overflow-x-hidden">
            {renderListBody()}
          </ScrollBarContainer>
        </main>
      </div>
      <Modal
        title="本地上传"
        open={uploadModalOpen}
        onCancel={() => {
          if (uploading) return
          setUploadModalOpen(false)
          setUploadFileList([])
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setUploadModalOpen(false)
              setUploadFileList([])
            }}
            disabled={uploading}
          >
            取消
          </Button>,
          <Button key="upload" type="primary" loading={uploading} onClick={handleUploadLocalSkill}>
            上传
          </Button>,
        ]}
        destroyOnHidden
      >
        <Upload
          accept=".zip,.skill"
          maxCount={1}
          fileList={uploadFileList}
          beforeUpload={() => false}
          onChange={({ fileList }) => setUploadFileList(fileList)}
          onRemove={() => {
            setUploadFileList([])
            return true
          }}
        >
          <Button block>选择文件</Button>
        </Upload>
        <p className="mb-0 mt-2 text-xs text-[--dip-text-color-45]">支持 .zip / .skill，大小不超过 32MB</p>
      </Modal>
    </Modal>
  )
}

export default SelectSkillModal
