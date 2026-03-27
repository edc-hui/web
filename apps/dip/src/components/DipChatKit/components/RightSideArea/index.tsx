import clsx from 'clsx'
import type React from 'react'
import PreviewArtifact from './PreviewArtifact'
import PreviewCode from './PreviewCode'
import PreviewMarkdown from './PreviewMarkdown'
import PreviewMermaid from './PreviewMermaid'
import PreviewPlaceholder from './PreviewPlaceholder'
import styles from './index.module.less'
import type { RightSideAreaProps } from './types'

const RightSideArea: React.FC<RightSideAreaProps> = ({ visible, payload, onClose }) => {
  const renderPreviewContent = () => {
    if (!payload) {
      return <PreviewPlaceholder />
    }

    if (payload.sourceType === 'artifact') {
      return <PreviewArtifact payload={payload} onClose={onClose} />
    }

    if (!payload.content) {
      return <PreviewPlaceholder />
    }

    if (payload.sourceType === 'code') {
      return <PreviewCode content={payload.content} />
    }

    if (payload.sourceType === 'mermaid') {
      return <PreviewMermaid content={payload.content} />
    }

    return <PreviewMarkdown content={payload.content} />
  }

  return (
    <div className={clsx('RightSideArea', styles.root)}>
      <div className={styles.content}>
        {!visible ? <PreviewPlaceholder /> : renderPreviewContent()}
      </div>
    </div>
  )
}

export default RightSideArea
