import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as ts from 'typescript'

const SERVER_DIR = join(process.cwd(), 'server')
const CONTEXT_METHODS = new Set(['info', 'warn', 'error', 'debug', 'success'])
const LOGGER_METHODS = new Set([...CONTEXT_METHODS, 'header', 'responseTime'])
const CONSOLE_METHODS = new Set(['log', 'info', 'warn', 'error', 'debug', 'trace'])

const CONTEXT_REQUIRED_FILES = [
    'server/api/inspect/index.ts',
    'server/api/auth/validate.ts',
    'server/api/sync/events.get.ts',
    'server/utils/helpers.ts',
    'server/utils/validation/zodHelpers.ts',
    'server/utils/database/historyHelpers.ts',
    'server/utils/database/saveHelpers.ts',
    'server/utils/database/itemSaveHandler.ts',
    'server/utils/health/sampler.ts',
    'server/utils/health/probes.ts',
    'server/utils/health/history.ts',
    'server/api/health/history.ts',
    'server/plugins/init.ts',
    'server/plugins/sync-cleanup.ts',
    'server/database/migrate.ts',
    'server/middleware/02.auth.ts',
    'server/middleware/03.admin-auth.ts',
    'server/api/items/gloves/index.ts',
]

interface CallInfo {
    method: string
    target: string
    args: ts.NodeArray<ts.Expression>
}

function listServerRuntimeFiles(dir: string, root = dir): string[] {
    const entries = readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
            if (entry.name === '__tests__') {
                continue
            }
            files.push(...listServerRuntimeFiles(fullPath, root))
            continue
        }

        if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
            continue
        }

        files.push(fullPath.replace(`${root}/`, 'server/'))
    }

    return files
}

function collectCalls(source: ts.SourceFile): CallInfo[] {
    const calls: CallInfo[] = []

    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const target = node.expression.expression.getText(source)
            const method = node.expression.name.text
            calls.push({ method, target, args: node.arguments })
        }

        ts.forEachChild(node, visit)
    }

    visit(source)
    return calls
}

function getMessageHeadText(arg: ts.Expression): string | null {
    if (ts.isStringLiteralLike(arg)) {
        return arg.text
    }

    if (ts.isTemplateExpression(arg)) {
        return arg.head.text
    }

    return null
}

function parseSource(relativePath: string): ts.SourceFile {
    const fullPath = join(process.cwd(), relativePath)
    const source = readFileSync(fullPath, 'utf8')
    return ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

describe('logging consistency guardrails', () => {
    it('disallows manual [Tag] message prefixes in runtime logger calls', () => {
        const runtimeFiles = listServerRuntimeFiles(SERVER_DIR)
        const offenders: string[] = []

        for (const relativePath of runtimeFiles) {
            const source = parseSource(relativePath)
            const calls = collectCalls(source)

            for (const call of calls) {
                if (!LOGGER_METHODS.has(call.method) || !call.target.endsWith('Logger')) {
                    continue
                }

                const firstArg = call.args[0]
                if (!firstArg) {
                    continue
                }

                const head = getMessageHeadText(firstArg)
                if (head && /^\[[A-Za-z0-9 _-]+\]/.test(head.trim())) {
                    offenders.push(
                        `${relativePath}:${source.getLineAndCharacterOfPosition(firstArg.getStart(source)).line + 1}`
                    )
                }
            }
        }

        expect(offenders).toEqual([])
    })

    it('disallows raw console.* calls in server runtime code', () => {
        const runtimeFiles = listServerRuntimeFiles(SERVER_DIR)
        const offenders: string[] = []

        for (const relativePath of runtimeFiles) {
            const source = parseSource(relativePath)
            const calls = collectCalls(source)

            for (const call of calls) {
                if (call.target !== 'console' || !CONSOLE_METHODS.has(call.method)) {
                    continue
                }

                offenders.push(relativePath)
            }
        }

        expect(offenders).toEqual([])
    })

    it('requires explicit logger context in critical server paths', () => {
        const offenders: string[] = []

        for (const relativePath of CONTEXT_REQUIRED_FILES) {
            const source = parseSource(relativePath)
            const calls = collectCalls(source)

            for (const call of calls) {
                if (call.target !== 'Logger' || !CONTEXT_METHODS.has(call.method)) {
                    continue
                }

                if (call.args.length < 2) {
                    offenders.push(
                        `${relativePath}:${source.getLineAndCharacterOfPosition(call.args.pos).line + 1}`
                    )
                    continue
                }

                const contextArg = call.args[1]
                if (
                    contextArg &&
                    ts.isStringLiteralLike(contextArg) &&
                    contextArg.text.trim().length === 0
                ) {
                    offenders.push(
                        `${relativePath}:${source.getLineAndCharacterOfPosition(contextArg.getStart(source)).line + 1}`
                    )
                }
            }
        }

        expect(offenders).toEqual([])
    })
})
