/**
 * 技能（Skills）API 类型定义。
 * 与 `skills.schemas.yaml`、`skills.paths.yaml` 中的 OpenAPI 描述一致。
 */

/**
 * 全局启用技能项（`DigitalHumanSkill`）。
 */
export interface DigitalHumanSkill {
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description?: string
  /**
   * 是否为 DIP 数字员工内置技能
   * 为 `true` 表示属于内置 trio：`archive-protocol`、`schedule-plan`、`kweaver-core`。
   */
  built_in: boolean
  /**
   * 技能来源标识，对应 OpenClaw `skills.status` 的 `source` 字段。
   *
   * 常见取值：
   * - `openclaw-bundled`：随 OpenClaw 一起发布的内置技能
   * - `openclaw-managed`：存放在 `~/.openclaw/skills/` 的托管技能（机器级共享）
   * - `agents-skills-personal`：存放在 `~/.agents/skills/` 的个人技能（用户级共享）
   * - `openclaw-extra`：来自配置的额外 skills 目录（`skills.load.extraDirs`）
   *
   * OpenClaw 可能新增其他来源，这里统一按字符串透传。
   */
  type: string
}

/** 全局启用技能列表（`DigitalHumanSkillList`） */
export type DigitalHumanSkillList = DigitalHumanSkill[]

/**
 * 安装 .skill 包后的响应（`InstallSkillResult`）。
 */
export interface InstallSkillResult {
  /** 技能 ID（来自 SKILL.md 或目录名） */
  name: string
  /** 网关上落盘的绝对路径 */
  skillPath: string
}

/**
 * 卸载技能后的响应（`UninstallSkillResult`）。
 */
export interface UninstallSkillResult {
  /** 已卸载的技能 ID */
  name: string
}
