import { del, get, post } from '@/utils/http'
import type { DigitalHumanSkillList, InstallSkillResult, UninstallSkillResult } from './index.d'

export type {
  DigitalHumanSkill,
  DigitalHumanSkillList,
  InstallSkillResult,
  UninstallSkillResult,
} from './index.d'

const BASE = '/api/dip-studio/v1'

export interface GetEnabledSkillsParams {
  /** 按技能 ID 或展示名称/描述模糊匹配，大小写不敏感 */
  name?: string
}

/** 获取全局启用技能列表（getEnabledSkills，`GET /skills`） */
export const getEnabledSkills = (params?: GetEnabledSkillsParams): Promise<DigitalHumanSkillList> => {
  const p1 = get(`${BASE}/skills`, { params })
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}

/** 获取指定数字员工已配置技能列表（getDigitalHumanSkills，`GET /digital-human/{id}/skills`） */
export const getDigitalHumanSkills = (id: string): Promise<DigitalHumanSkillList> => {
  const p1 = get(`${BASE}/digital-human/${id}/skills`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}

export interface InstallSkillPayload {
  /** ZIP 包（建议扩展名 .skill 或 .zip；与 OpenClaw .skill 约定一致） */
  file: File | Blob
  /**
   * 为 `true` 或 `1` 时覆盖已存在的技能目录。
   * 按文档要求以字符串形式传递。
   */
  overwrite?: 'true' | '1'
  /** 技能目录名（slug）；不传则使用上传文件名推导（与 DIP slug 规则一致） */
  skillName?: string
}

/** 上传并安装 .skill 包（installSkill，`POST /skills/install`） */
export const installSkill = (payload: InstallSkillPayload): Promise<InstallSkillResult> => {
  const formData = new FormData()
  formData.append('file', payload.file)

  if (payload.overwrite !== undefined) {
    formData.append('overwrite', payload.overwrite)
  }

  if (payload.skillName) {
    formData.append('skillName', payload.skillName)
  }

  const p1 = post(`${BASE}/skills/install`, { body: formData })
  const p2 = p1.then((result: unknown) => result as InstallSkillResult)
  p2.abort = p1.abort
  return p2
}

/** 卸载技能目录（uninstallSkill，`DELETE /skills/{name}`） */
export const uninstallSkill = (name: string): Promise<UninstallSkillResult> => {
  const p1 = del(`${BASE}/skills/${encodeURIComponent(name)}`)
  const p2 = p1.then((result: unknown) => result as UninstallSkillResult)
  p2.abort = p1.abort
  return p2
}
