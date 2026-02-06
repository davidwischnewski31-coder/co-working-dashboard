import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface ParsedProject {
  name: string
  description: string
  status: 'idea' | 'active' | 'paused' | 'shipped'
  tags?: string[]
  links?: string[]
  metadata?: Record<string, any>
}

export function parseProjectMarkdown(filePath: string): ParsedProject | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    // Extract first paragraph as description if not in frontmatter
    let description = data.description || ''
    if (!description) {
      const lines = content.split('\n').filter(line => line.trim())
      const firstParagraph = lines.find(line => !line.startsWith('#') && line.trim())
      description = firstParagraph || ''
    }

    // Determine status from frontmatter or default to 'active'
    let status: 'idea' | 'active' | 'paused' | 'shipped' = 'active'
    if (data.status) {
      const statusLower = data.status.toLowerCase()
      if (['idea', 'active', 'paused', 'shipped'].includes(statusLower)) {
        status = statusLower as any
      }
    }

    return {
      name: data.name || data.title || path.basename(path.dirname(filePath)),
      description: description.slice(0, 500), // Limit description length
      status,
      tags: data.tags || [],
      links: data.links || [],
      metadata: {
        source_path: filePath,
        ...data,
      },
    }
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error)
    return null
  }
}

export function getDavidAIProjects(davidaiPath: string): ParsedProject[] {
  const knowledgeProjectsPath = path.join(davidaiPath, 'knowledge/projects')
  
  try {
    const projectDirs = fs.readdirSync(knowledgeProjectsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    const projects: ParsedProject[] = []

    for (const projectName of projectDirs) {
      const readmePath = path.join(knowledgeProjectsPath, projectName, 'README.md')
      const project = parseProjectMarkdown(readmePath)
      
      if (project) {
        projects.push(project)
      }
    }

    return projects
  } catch (error) {
    console.error('Failed to read davidai projects:', error)
    return []
  }
}
