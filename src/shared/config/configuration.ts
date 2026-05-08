import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

const CONFIG_DIR = path.resolve(process.cwd(), 'config')

function loadYaml(filename: string): Record<string, unknown> {
  const filePath = path.join(CONFIG_DIR, filename)
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  return (yaml.load(raw) as Record<string, unknown>) ?? {}
}

export default () => {
  const app = loadYaml('app.yml')
  const db = loadYaml('database.yml')
  return { ...app, ...db }
}
