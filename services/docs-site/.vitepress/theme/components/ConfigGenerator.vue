<script setup lang="ts">
import { ref, computed } from 'vue'

const currentStep = ref(0)
const copied = ref(false)

const steps = [
    { title: 'Database', icon: '1' },
    { title: 'Features', icon: '2' },
    { title: 'Permissions', icon: '3' },
    { title: 'Weapons', icon: '4' },
    { title: 'Logging', icon: '5' },
    { title: 'Review', icon: '6' },
]

// --- Reactive config state ---

const db = ref({
    host: 'localhost',
    port: 3306,
    user: '',
    password: '',
    name: '',
})

const features = ref({
    KnifeEnabled: true,
    KnifeDroppingEnabled: false,
    KnifeShortCommandsEnabled: true,
    GloveEnabled: true,
    MusicEnabled: true,
    AgentEnabled: true,
    SkinEnabled: true,
    PinsEnabled: true,
    ShowSkinImage: true,
    HideChatCommandMessages: true,
})

const featureDescriptions: Record<string, string> = {
    KnifeEnabled: 'Enable knife system (!knife, knife loadout data)',
    KnifeDroppingEnabled: 'Allow players to drop their knife (sets mp_drop_knife_enable 1)',
    KnifeShortCommandsEnabled: 'Enable per-knife shortcuts (!karambit, !butterfly, etc.)',
    GloveEnabled: 'Enable glove system (!glove, !gloves)',
    MusicEnabled: 'Enable music kit system (!music)',
    AgentEnabled: 'Enable custom agent models (!agent)',
    SkinEnabled: 'Enable weapon skin application (loadouts and !g)',
    PinsEnabled: 'Enable pins (!pin)',
    ShowSkinImage: "Show a preview image for the player's current weapon skin",
    HideChatCommandMessages: 'Hide command messages (e.g. !g ...) from public chat',
}

const permissions = ref({
    global: '',
    Knives: '',
    Gloves: '',
    Weapons: '',
    Music: '',
    Pins: '',
    Agents: '',
})

const weaponCommands = ref({
    enabled: false,
    replaceOnGive: true,
    weapons: [
        { key: 'awp', command: 'awp', giveWeapon: true, enabled: true },
        { key: 'ak47', command: 'ak47', giveWeapon: false, enabled: true },
        { key: 'm4a4', command: 'm4a4', giveWeapon: false, enabled: true },
        { key: 'm4a1s', command: 'm4a1s', giveWeapon: false, enabled: true },
    ] as Array<{ key: string; command: string; giveWeapon: boolean; enabled: boolean }>,
})

const logging = ref({
    globalLevel: 'Info',
    fileLoggingEnabled: true,
    logDirectory: 'logs/CS2Inspect',
})

const logLevels = ['Debug', 'Info', 'Warning', 'Error']

// --- Weapon shortcut helpers ---

function addWeapon() {
    weaponCommands.value.weapons.push({ key: '', command: '', giveWeapon: false, enabled: true })
}

function removeWeapon(index: number) {
    weaponCommands.value.weapons.splice(index, 1)
}

// --- Validation ---

const canProceed = computed(() => {
    if (currentStep.value === 0) {
        return db.value.user.trim() !== '' && db.value.name.trim() !== ''
    }
    return true
})

// --- Build final JSON ---

const generatedConfig = computed(() => {
    const weaponsObj: Record<string, { Enabled: boolean; Command: string; GiveWeapon: boolean }> =
        {}
    if (weaponCommands.value.enabled) {
        for (const w of weaponCommands.value.weapons) {
            if (w.key.trim()) {
                weaponsObj[w.key.trim()] = {
                    Enabled: w.enabled,
                    Command: w.command.trim() || w.key.trim(),
                    GiveWeapon: w.giveWeapon,
                }
            }
        }
    }

    const config: Record<string, unknown> = {
        ConfigVersion: 11,
        SkinsLanguage: 'en',
        DatabaseHost: db.value.host || 'localhost',
        DatabasePort: db.value.port || 3306,
        DatabaseUser: db.value.user,
        DatabasePassword: db.value.password,
        DatabaseName: db.value.name,
        Additional: {
            ...features.value,
            DisabledKnifeCommands: [],
            RequiredCommandPermission: permissions.value.global,
            CommandPermissions: {
                Knives: permissions.value.Knives,
                Gloves: permissions.value.Gloves,
                Weapons: permissions.value.Weapons,
                Music: permissions.value.Music,
                Pins: permissions.value.Pins,
                Agents: permissions.value.Agents,
            },
        },
        MenuType: 'selectable',
        Logging: {
            GlobalLogLevel: logging.value.globalLevel,
            ShowTimestamp: true,
            ShowCategory: true,
            PluginPrefix: 'CS2Inspect',
            Categories: {
                Database: 'Info',
                Commands: 'Info',
                Weapons: 'Info',
                Handlers: 'Info',
                Events: 'Info',
                Performance: 'Warning',
                Security: 'Warning',
                Configuration: 'Info',
                Menu: 'Info',
                Network: 'Info',
                ErrorHandling: 'Error',
            },
            FileLogging: {
                Enabled: logging.value.fileLoggingEnabled,
                LogDirectory: logging.value.logDirectory || 'logs/CS2Inspect',
                MaxFileSize: '10MB',
                MaxFiles: 5,
                FileNamePattern: 'cs2inspect-{date:yyyy-MM-dd}.log',
                IncludeColors: false,
                MinimumLogLevel: 'Debug',
                AutoFlush: true,
            },
            Performance: {
                AsyncLogging: true,
                BufferSize: 1000,
                FlushInterval: 5000,
                IncludeStackTrace: false,
                MaxMessageLength: 2000,
            },
            Formatting: {
                TimestampFormat: 'HH:mm:ss.fff',
                PadLogLevels: true,
                CompactFormat: false,
                IncludeThreadId: false,
                CustomFormat: null,
            },
        },
        WeaponCommands: {
            Enabled: weaponCommands.value.enabled,
            ReplaceWeaponOnGive: weaponCommands.value.replaceOnGive,
            Weapons: weaponsObj,
        },
    }

    return JSON.stringify(config, null, 2)
})

// --- Navigation ---

function next() {
    if (currentStep.value < steps.length - 1 && canProceed.value) {
        currentStep.value++
    }
}

function prev() {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

function goToStep(index: number) {
    if (index <= currentStep.value || canProceed.value) {
        currentStep.value = index
    }
}

// --- Copy ---

async function copyConfig() {
    try {
        await navigator.clipboard.writeText(generatedConfig.value)
        copied.value = true
        setTimeout(() => {
            copied.value = false
        }, 2000)
    } catch {
        // Fallback
        const textarea = document.createElement('textarea')
        textarea.value = generatedConfig.value
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        copied.value = true
        setTimeout(() => {
            copied.value = false
        }, 2000)
    }
}
</script>

<template>
    <div class="config-generator">
        <!-- Step indicator -->
        <div class="steps-bar">
            <div
                v-for="(step, i) in steps"
                :key="i"
                class="step-item"
                :class="{ active: i === currentStep, completed: i < currentStep }"
                @click="goToStep(i)"
            >
                <div class="step-circle">
                    <span v-if="i < currentStep" class="check">&#10003;</span>
                    <span v-else>{{ step.icon }}</span>
                </div>
                <span class="step-label">{{ step.title }}</span>
            </div>
        </div>

        <!-- Step content -->
        <div class="step-content">
            <!-- Step 0: Database -->
            <div v-if="currentStep === 0" class="step-panel">
                <h3>Database Connection</h3>
                <p class="step-desc">
                    Enter the MariaDB/MySQL credentials. These must point to the
                    <strong>same database</strong> used by your CS2Inspect web application.
                </p>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Host</label>
                        <input v-model="db.host" type="text" placeholder="localhost" />
                    </div>
                    <div class="form-group form-group-small">
                        <label>Port</label>
                        <input v-model.number="db.port" type="number" placeholder="3306" />
                    </div>
                    <div class="form-group">
                        <label>Username <span class="required">*</span></label>
                        <input v-model="db.user" type="text" placeholder="cs2inspect" />
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input v-model="db.password" type="password" placeholder="your_password" />
                    </div>
                    <div class="form-group">
                        <label>Database Name <span class="required">*</span></label>
                        <input v-model="db.name" type="text" placeholder="cs2inspect" />
                    </div>
                </div>
                <p v-if="!canProceed" class="validation-msg">
                    Username and Database Name are required to continue.
                </p>
            </div>

            <!-- Step 1: Features -->
            <div v-if="currentStep === 1" class="step-panel">
                <h3>Feature Toggles</h3>
                <p class="step-desc">
                    Enable or disable plugin features. Disabled features bypass their handlers and
                    database lookups entirely.
                </p>
                <div class="toggle-list">
                    <div v-for="(value, key) in features" :key="key" class="toggle-row">
                        <label class="toggle-switch">
                            <input
                                type="checkbox"
                                v-model="features[key as keyof typeof features]"
                            />
                            <span class="toggle-slider" />
                        </label>
                        <div class="toggle-info">
                            <span class="toggle-name">{{ key }}</span>
                            <span class="toggle-desc">{{
                                featureDescriptions[key as string]
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 2: Permissions -->
            <div v-if="currentStep === 2" class="step-panel">
                <h3>Permissions</h3>
                <p class="step-desc">
                    Optionally restrict commands using CounterStrikeSharp admin flags. Leave empty
                    for no restriction. Common flags: <code>@css/root</code>, <code>@css/vip</code>,
                    <code>@css/ban</code>.
                </p>
                <div class="form-grid">
                    <div class="form-group form-group-full">
                        <label>Global Permission (applies to ALL commands)</label>
                        <input
                            v-model="permissions.global"
                            type="text"
                            placeholder="Leave empty for no restriction"
                        />
                    </div>
                </div>
                <h4>Per-Category Permissions</h4>
                <p class="step-desc-small">
                    These are checked <strong>in addition</strong> to the global permission.
                </p>
                <div class="form-grid perm-grid">
                    <div
                        v-for="cat in ['Knives', 'Gloves', 'Weapons', 'Music', 'Pins', 'Agents']"
                        :key="cat"
                        class="form-group"
                    >
                        <label>{{ cat }}</label>
                        <input
                            v-model="permissions[cat as keyof typeof permissions]"
                            type="text"
                            placeholder="Empty = no restriction"
                        />
                    </div>
                </div>
            </div>

            <!-- Step 3: Weapon Shortcuts -->
            <div v-if="currentStep === 3" class="step-panel">
                <h3>Weapon Shortcuts</h3>
                <p class="step-desc">
                    Enable per-weapon shortcut commands (e.g., <code>!awp</code> instead of
                    <code>!g awp</code>).
                </p>
                <div class="toggle-row" style="margin-bottom: 1rem">
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="weaponCommands.enabled" />
                        <span class="toggle-slider" />
                    </label>
                    <div class="toggle-info">
                        <span class="toggle-name">Enable Weapon Shortcuts</span>
                    </div>
                </div>

                <template v-if="weaponCommands.enabled">
                    <div class="toggle-row" style="margin-bottom: 1rem">
                        <label class="toggle-switch">
                            <input type="checkbox" v-model="weaponCommands.replaceOnGive" />
                            <span class="toggle-slider" />
                        </label>
                        <div class="toggle-info">
                            <span class="toggle-name">Replace Weapon On Give</span>
                            <span class="toggle-desc"
                                >When GiveWeapon is enabled, replace the player's existing
                                weapon</span
                            >
                        </div>
                    </div>

                    <div class="weapon-list">
                        <div v-for="(w, i) in weaponCommands.weapons" :key="i" class="weapon-entry">
                            <div class="weapon-fields">
                                <div class="form-group">
                                    <label>Key</label>
                                    <input v-model="w.key" type="text" placeholder="awp" />
                                </div>
                                <div class="form-group">
                                    <label>Command</label>
                                    <input
                                        v-model="w.command"
                                        type="text"
                                        :placeholder="w.key || 'awp'"
                                    />
                                </div>
                                <div class="weapon-toggles">
                                    <label class="toggle-switch toggle-small">
                                        <input type="checkbox" v-model="w.enabled" />
                                        <span class="toggle-slider" />
                                    </label>
                                    <span class="toggle-desc-inline">Enabled</span>
                                    <label class="toggle-switch toggle-small">
                                        <input type="checkbox" v-model="w.giveWeapon" />
                                        <span class="toggle-slider" />
                                    </label>
                                    <span class="toggle-desc-inline">Give Weapon</span>
                                </div>
                            </div>
                            <button class="btn-remove" @click="removeWeapon(i)" title="Remove">
                                &#215;
                            </button>
                        </div>
                    </div>
                    <button class="btn-add" @click="addWeapon">+ Add Weapon</button>
                </template>
            </div>

            <!-- Step 4: Logging -->
            <div v-if="currentStep === 4" class="step-panel">
                <h3>Logging</h3>
                <p class="step-desc">
                    Configure the plugin's logging behavior. Advanced settings (per-category levels,
                    formatting) use sensible defaults and can be tuned later.
                </p>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Global Log Level</label>
                        <select v-model="logging.globalLevel">
                            <option v-for="level in logLevels" :key="level" :value="level">
                                {{ level }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Log Directory</label>
                        <input
                            v-model="logging.logDirectory"
                            type="text"
                            placeholder="logs/CS2Inspect"
                        />
                    </div>
                </div>
                <div class="toggle-row" style="margin-top: 1rem">
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="logging.fileLoggingEnabled" />
                        <span class="toggle-slider" />
                    </label>
                    <div class="toggle-info">
                        <span class="toggle-name">File Logging</span>
                        <span class="toggle-desc"
                            >Write logs to disk (recommended for production)</span
                        >
                    </div>
                </div>
            </div>

            <!-- Step 5: Review & Copy -->
            <div v-if="currentStep === 5" class="step-panel">
                <h3>Your Configuration</h3>
                <p class="step-desc">
                    Copy this JSON and save it as
                    <code>configs/plugins/CS2Inspect/CS2Inspect.json</code> on your game server.
                </p>
                <div class="output-wrapper">
                    <div class="output-toolbar">
                        <span class="output-filename">CS2Inspect.json</span>
                        <button class="btn-copy" @click="copyConfig">
                            {{ copied ? '&#10003; Copied!' : 'Copy' }}
                        </button>
                    </div>
                    <pre class="output-code"><code>{{ generatedConfig }}</code></pre>
                </div>
                <p class="step-desc-small" style="margin-top: 1rem">
                    For detailed documentation on each setting, see the
                    <a href="./configuration.html">Configuration Reference</a>.
                </p>
            </div>
        </div>

        <!-- Navigation -->
        <div class="nav-buttons">
            <button class="btn-nav btn-prev" :disabled="currentStep === 0" @click="prev">
                &larr; Previous
            </button>
            <span class="step-counter">{{ currentStep + 1 }} / {{ steps.length }}</span>
            <button
                v-if="currentStep < steps.length - 1"
                class="btn-nav btn-next"
                :disabled="!canProceed"
                @click="next"
            >
                Next &rarr;
            </button>
            <button v-else class="btn-nav btn-next btn-copy-final" @click="copyConfig">
                {{ copied ? '&#10003; Copied!' : 'Copy Config' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.config-generator {
    margin-top: 1.5rem;
}

/* --- Step Bar --- */
.steps-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    position: relative;
    padding: 0 0.5rem;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    flex: 1;
    position: relative;
    z-index: 1;
}

.step-item::after {
    content: '';
    position: absolute;
    top: 16px;
    left: calc(50% + 16px);
    right: calc(-50% + 16px);
    height: 2px;
    background: var(--vp-c-border);
    z-index: 0;
}

.step-item:last-child::after {
    display: none;
}

.step-item.completed::after {
    background: var(--vp-c-brand-1);
}

.step-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    background: var(--vp-c-bg-mute);
    border: 2px solid var(--vp-c-border);
    color: var(--vp-c-text-3);
    transition: all 0.2s ease;
    position: relative;
    z-index: 2;
}

.step-item.active .step-circle {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
    background: var(--vp-c-bg-mute);
}

.step-item.completed .step-circle {
    background: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
    color: #121212;
}

.check {
    font-size: 16px;
    font-weight: 700;
}

.step-label {
    font-size: 12px;
    color: var(--vp-c-text-3);
    text-align: center;
}

.step-item.active .step-label {
    color: var(--vp-c-brand-1);
    font-weight: 600;
}

.step-item.completed .step-label {
    color: var(--vp-c-text-2);
}

/* --- Step Content --- */
.step-content {
    min-height: 350px;
}

.step-panel {
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-border);
    border-radius: 12px;
    padding: 1.5rem;
}

.step-panel h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    color: var(--vp-c-text-1);
}

.step-panel h4 {
    margin: 1.25rem 0 0.25rem 0;
    font-size: 1rem;
    color: var(--vp-c-text-1);
}

.step-desc {
    color: var(--vp-c-text-2);
    font-size: 14px;
    margin: 0 0 1.25rem 0;
    line-height: 1.5;
}

.step-desc-small {
    color: var(--vp-c-text-3);
    font-size: 13px;
    margin: 0 0 0.75rem 0;
}

/* --- Forms --- */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group-small {
    max-width: 120px;
}

.form-group-full {
    grid-column: 1 / -1;
}

.perm-grid {
    grid-template-columns: 1fr 1fr 1fr;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.form-group label {
    font-size: 13px;
    font-weight: 500;
    color: var(--vp-c-text-2);
}

.required {
    color: #ef4444;
}

.form-group input,
.form-group select {
    background: var(--vp-c-bg-mute);
    border: 1px solid var(--vp-c-border);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    color: var(--vp-c-text-1);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
    border-color: var(--vp-c-brand-1);
}

.form-group input::placeholder {
    color: var(--vp-c-text-3);
}

.form-group select {
    cursor: pointer;
}

.form-group select option {
    background: var(--vp-c-bg-mute);
    color: var(--vp-c-text-1);
}

.validation-msg {
    color: #ef4444;
    font-size: 13px;
    margin-top: 0.75rem;
}

/* --- Toggle switches --- */
.toggle-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.toggle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
}

.toggle-switch.toggle-small {
    width: 36px;
    height: 20px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--vp-c-bg-mute);
    border: 1px solid var(--vp-c-border);
    border-radius: 24px;
    transition: all 0.2s ease;
}

.toggle-slider::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background: var(--vp-c-text-3);
    border-radius: 50%;
    transition: all 0.2s ease;
}

.toggle-small .toggle-slider::before {
    height: 14px;
    width: 14px;
}

input:checked + .toggle-slider {
    background: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}

input:checked + .toggle-slider::before {
    background: #121212;
    transform: translateX(20px);
}

.toggle-small input:checked + .toggle-slider::before {
    transform: translateX(16px);
}

.toggle-info {
    display: flex;
    flex-direction: column;
}

.toggle-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    font-family: var(--vp-font-family-mono);
}

.toggle-desc {
    font-size: 12px;
    color: var(--vp-c-text-3);
}

.toggle-desc-inline {
    font-size: 12px;
    color: var(--vp-c-text-2);
    margin-right: 0.75rem;
}

/* --- Weapon shortcuts --- */
.weapon-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.weapon-entry {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    background: var(--vp-c-bg-mute);
    border: 1px solid var(--vp-c-border);
    border-radius: 8px;
    padding: 0.75rem;
}

.weapon-fields {
    flex: 1;
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    flex-wrap: wrap;
}

.weapon-fields .form-group {
    flex: 1;
    min-width: 100px;
}

.weapon-toggles {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
}

.btn-remove {
    background: none;
    border: 1px solid var(--vp-c-border);
    color: var(--vp-c-text-3);
    cursor: pointer;
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.btn-remove:hover {
    border-color: #ef4444;
    color: #ef4444;
}

.btn-add {
    background: var(--vp-c-bg-mute);
    border: 1px dashed var(--vp-c-border);
    color: var(--vp-c-text-2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
}

.btn-add:hover {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
}

/* --- Output --- */
.output-wrapper {
    border: 1px solid var(--vp-c-border);
    border-radius: 12px;
    overflow: hidden;
}

.output-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: var(--vp-c-bg-mute);
    border-bottom: 1px solid var(--vp-c-border);
}

.output-filename {
    font-size: 13px;
    color: var(--vp-c-text-2);
    font-family: var(--vp-font-family-mono);
}

.btn-copy {
    background: var(--vp-c-brand-1);
    color: #121212;
    border: none;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 70px;
}

.btn-copy:hover {
    background: var(--vp-c-brand-2);
}

.output-code {
    margin: 0;
    padding: 1rem;
    background: var(--vp-code-block-bg);
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
    max-height: 500px;
    color: var(--vp-c-text-1);
}

/* --- Navigation Buttons --- */
.nav-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--vp-c-border);
}

.step-counter {
    font-size: 13px;
    color: var(--vp-c-text-3);
}

.btn-nav {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--vp-c-border);
    background: var(--vp-c-bg-mute);
    color: var(--vp-c-text-1);
}

.btn-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.btn-nav:not(:disabled):hover {
    border-color: var(--vp-c-brand-1);
}

.btn-next {
    background: var(--vp-c-brand-1);
    color: #121212;
    border-color: var(--vp-c-brand-1);
    font-weight: 600;
}

.btn-next:not(:disabled):hover {
    background: var(--vp-c-brand-2);
    border-color: var(--vp-c-brand-2);
}

.btn-copy-final {
    min-width: 120px;
}

/* --- Responsive --- */
@media (max-width: 640px) {
    .steps-bar {
        gap: 0;
    }

    .step-label {
        font-size: 10px;
    }

    .step-circle {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .perm-grid {
        grid-template-columns: 1fr;
    }

    .weapon-fields {
        flex-direction: column;
    }

    .weapon-toggles {
        flex-wrap: wrap;
    }

    .step-panel {
        padding: 1rem;
    }
}
</style>
