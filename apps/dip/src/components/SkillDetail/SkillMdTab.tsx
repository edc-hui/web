import { Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import { getSkillFileContent } from '@/apis'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { SkillTabStateShell } from './SkillTabStateShell'

export interface SkillMdTabProps {
  skillName: string
}

const SkillMdTab = ({ skillName }: SkillMdTabProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (!skillName.trim()) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getSkillFileContent(skillName)
        if (cancelled) return
        setContent(res.content)
        setTruncated(res.truncated)
      } catch {
        if (cancelled) return
        setError('SKILL.md 加载失败')
        setContent(null)
        setTruncated(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [skillName])

  if (loading) {
    return (
      <SkillTabStateShell>
        <Spin />
      </SkillTabStateShell>
    )
  }
  if (error) {
    return (
      <SkillTabStateShell>
        <Empty type="failed" title={error} />
      </SkillTabStateShell>
    )
  }
  if (content === null || content === '') {
    return (
      <SkillTabStateShell>
        <Empty type="empty" title="暂无 SKILL.md 内容" />
      </SkillTabStateShell>
    )
  }
  return (
    <ScrollBarContainer className="min-h-0 flex-1 rounded-lg border border-[--dip-border-color] bg-[#FAFBFC] p-4">
      <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[--dip-text-color]">
        {content}
        {truncated && (
          <span className="mt-2 block text-xs text-[--dip-text-color-45]">（内容已截断）</span>
        )}
      </pre>
    </ScrollBarContainer>
  )
}

export default memo(SkillMdTab)
