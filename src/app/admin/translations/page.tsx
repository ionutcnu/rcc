"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, RefreshCw, Save, Trash2, AlertTriangle } from "lucide-react"
import { useCatPopup } from "@/hooks/use-cat-popup"
import {
    getTranslationSettings,
    updateTranslationSettings,
    getTranslationUsageHistory,
} from "@/lib/firebase/translationService"
import type { DeepLUsage } from "@/lib/i18n/usageTracker"
import { type Language, languages, languageOptions } from "@/lib/i18n/types"
import { useAuth } from "@/lib/auth/auth-context"

export default function TranslationsPage() {
    const { showPopup } = useCatPopup()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [usageLoading, setUsageLoading] = useState(false)
    const [settings, setSettings] = useState({
        enabled: true,
        customLimit: 400000,
        warningThreshold: 80,
        criticalThreshold: 95,
        defaultLanguage: "en" as Language,
        availableLanguages: ["en", "fr", "de", "it", "ro"] as Language[],
        cacheEnabled: true,
        cacheTTL: 24, // hours
    })
    const [usage, setUsage] = useState<DeepLUsage>({
        characterCount: 0,
        characterLimit: 500000,
        percentUsed: 0,
        limitReached: false,
        lastChecked: new Date(),
    })
    const [saving, setSaving] = useState(false)
    const [usageHistory, setUsageHistory] = useState<{ date: string; count: number }[]>([])

    // Fetch settings and usage on load
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                // Fetch settings from Firebase
                const savedSettings = await getTranslationSettings()
                if (savedSettings) {
                    setSettings(savedSettings)
                }

                // Fetch current usage
                await fetchUsage()

                // Fetch usage history
                const history = await getTranslationUsageHistory()
                setUsageHistory(history)
            } catch (error) {
                console.error("Error loading translation settings:", error)
                showPopup("Error: Failed to load translation settings")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Fetch current usage from API
    const fetchUsage = async () => {
        try {
            setUsageLoading(true)
            const response = await fetch("/api/translate/usage")
            if (!response.ok) {
                throw new Error("Failed to fetch usage data")
            }
            const data = await response.json()
            setUsage(data)
        } catch (error) {
            console.error("Error fetching usage:", error)
            showPopup("Error: Failed to fetch DeepL usage statistics")
        } finally {
            setUsageLoading(false)
        }
    }

    // Save settings to Firebase
    const saveSettings = async () => {
        try {
            setSaving(true)
            await updateTranslationSettings(settings)
            showPopup("Translation settings saved successfully")

            // Refresh usage with new settings (e.g., if custom limit changed)
            await fetchUsage()
        } catch (error) {
            console.error("Error saving settings:", error)
            showPopup("Error: Failed to save translation settings")
        } finally {
            setSaving(false)
        }
    }

    // Reset usage tracking (for testing)
    const resetUsageTracking = async () => {
        try {
            const response = await fetch("/api/translate/reset-usage", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user?.token || ""}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to reset usage tracking")
            }

            showPopup("Usage tracking reset successfully")
            await fetchUsage()
        } catch (error) {
            console.error("Error resetting usage:", error)
            showPopup("Error: Failed to reset usage tracking")
        }
    }

    // Clear translation cache
    const clearCache = async () => {
        try {
            const response = await fetch("/api/translate/clear-cache", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user?.token || ""}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to clear cache")
            }

            showPopup("Translation cache cleared successfully")
        } catch (error) {
            console.error("Error clearing cache:", error)
            showPopup("Error: Failed to clear translation cache")
        }
    }

    // Test translation
    const testTranslation = async () => {
        try {
            const testText = "Hello, this is a test translation. The quick brown fox jumps over the lazy dog."
            const targetLang = settings.availableLanguages.find((lang) => lang !== settings.defaultLanguage) || "fr"

            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: testText,
                    targetLanguage: targetLang,
                    sourceLanguage: settings.defaultLanguage,
                }),
            })

            if (!response.ok) {
                throw new Error("Translation test failed")
            }

            const result = await response.json()

            showPopup(`Translation test successful! "${testText}" → "${result.translatedText}"`)

            // Refresh usage after test
            await fetchUsage()
        } catch (error) {
            console.error("Error testing translation:", error)
            showPopup("Error: Translation test failed")
        }
    }

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString()
    }

    // Get status color based on usage percentage
    const getStatusColor = (percent: number) => {
        if (percent >= settings.criticalThreshold) return "bg-red-500"
        if (percent >= settings.warningThreshold) return "bg-yellow-500"
        return "bg-green-500"
    }

    // Toggle language availability
    const toggleLanguage = (lang: Language) => {
        if (lang === settings.defaultLanguage) return // Can't disable default language

        if (settings.availableLanguages.includes(lang)) {
            setSettings({
                ...settings,
                availableLanguages: settings.availableLanguages.filter((l) => l !== lang),
            })
        } else {
            setSettings({
                ...settings,
                availableLanguages: [...settings.availableLanguages, lang],
            })
        }
    }

    // Get flag emoji for a language code
    const getLanguageFlag = (code: Language): string => {
        const option = languageOptions.find((lang) => lang.code === code)
        return option ? option.flag : "🌐"
    }

    // Get language name for a language code
    const getLanguageName = (code: Language): string => {
        return languages[code] || code
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Translation Management</h1>
                <div className="flex gap-2">
                    <Button onClick={testTranslation} variant="outline" className="gap-2">
                        Test Translation
                    </Button>
                    <Button onClick={saveSettings} disabled={saving} className="gap-2">
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="usage">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                </TabsList>

                {/* Usage Statistics Tab */}
                <TabsContent value="usage" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Characters Used</CardTitle>
                                <CardDescription>Current billing period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{usage.characterCount.toLocaleString()}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Character Limit</CardTitle>
                                <CardDescription>DeepL free tier</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{usage.characterLimit.toLocaleString()}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Usage Percentage</CardTitle>
                                <CardDescription>
                                    Last checked: {formatDate(usage.lastChecked)}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 ml-2"
                                        onClick={fetchUsage}
                                        disabled={usageLoading}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${usageLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{usage.percentUsed.toFixed(1)}%</div>
                                <Progress value={usage.percentUsed} className="h-2 mt-2" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Status</CardTitle>
                            <CardDescription>Current translation service status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {usage.limitReached ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Character Limit Reached</AlertTitle>
                                    <AlertDescription>
                                        You have reached your DeepL API character limit for this month. Translations are currently disabled.
                                        The limit will reset at the beginning of your next billing cycle.
                                    </AlertDescription>
                                </Alert>
                            ) : usage.percentUsed >= settings.criticalThreshold ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Critical Usage Level</AlertTitle>
                                    <AlertDescription>
                                        You have used {usage.percentUsed.toFixed(1)}% of your DeepL API character limit. Consider limiting
                                        translations to essential content only until your limit resets.
                                    </AlertDescription>
                                </Alert>
                            ) : usage.percentUsed >= settings.warningThreshold ? (
                                <Alert className="border-yellow-500 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <AlertTitle>High Usage Warning</AlertTitle>
                                    <AlertDescription>
                                        You have used {usage.percentUsed.toFixed(1)}% of your DeepL API character limit. Monitor your usage
                                        carefully to avoid reaching the limit before the end of the month.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <AlertTitle>Normal Usage</AlertTitle>
                                    <AlertDescription>
                                        Your DeepL API usage is at a healthy level. You have used {usage.percentUsed.toFixed(1)}% of your
                                        monthly character limit.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div className="text-sm text-muted-foreground">
                                Characters remaining: {(usage.characterLimit - usage.characterCount).toLocaleString()}
                            </div>
                            <Button variant="outline" size="sm" onClick={resetUsageTracking}>
                                Reset Usage Tracking
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Usage History</CardTitle>
                            <CardDescription>Character usage over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <div className="flex h-full items-end gap-2">
                                    {usageHistory.map((day, i) => (
                                        <div key={i} className="relative flex h-full w-full flex-col justify-end">
                                            <div
                                                className={`w-full rounded-md ${getStatusColor(
                                                    (day.count / usage.characterLimit) * 100,
                                                )} transition-all`}
                                                style={{ height: `${(day.count / usage.characterLimit) * 100}%` }}
                                            ></div>
                                            <span className="mt-2 text-center text-xs">{day.date.split("-")[2]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Translation Service</CardTitle>
                            <CardDescription>Configure the translation service settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="translation-enabled">Enable Translation Service</Label>
                                    <p className="text-sm text-muted-foreground">When disabled, no translations will be performed</p>
                                </div>
                                <Switch
                                    id="translation-enabled"
                                    checked={settings.enabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="custom-limit">Custom Character Limit</Label>
                                <p className="text-sm text-muted-foreground">
                                    Set a custom limit below the DeepL free tier limit (500,000 characters)
                                </p>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        id="custom-limit"
                                        min={100000}
                                        max={500000}
                                        step={10000}
                                        value={[settings.customLimit]}
                                        onValueChange={(value) => setSettings({ ...settings, customLimit: value[0] })}
                                        disabled={!settings.enabled}
                                        className="flex-1"
                                    />
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            value={settings.customLimit}
                                            onChange={(e) => setSettings({ ...settings, customLimit: Number.parseInt(e.target.value) || 0 })}
                                            disabled={!settings.enabled}
                                            min={100000}
                                            max={500000}
                                            step={10000}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="warning-threshold">Warning Threshold (%)</Label>
                                    <p className="text-sm text-muted-foreground">Show warning when usage exceeds this percentage</p>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            id="warning-threshold"
                                            min={50}
                                            max={90}
                                            step={5}
                                            value={[settings.warningThreshold]}
                                            onValueChange={(value) => setSettings({ ...settings, warningThreshold: value[0] })}
                                            disabled={!settings.enabled}
                                            className="flex-1"
                                        />
                                        <div className="w-16">
                                            <Input
                                                type="number"
                                                value={settings.warningThreshold}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, warningThreshold: Number.parseInt(e.target.value) || 0 })
                                                }
                                                disabled={!settings.enabled}
                                                min={50}
                                                max={90}
                                                step={5}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="critical-threshold">Critical Threshold (%)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show critical warning when usage exceeds this percentage
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            id="critical-threshold"
                                            min={80}
                                            max={99}
                                            step={1}
                                            value={[settings.criticalThreshold]}
                                            onValueChange={(value) => setSettings({ ...settings, criticalThreshold: value[0] })}
                                            disabled={!settings.enabled}
                                            className="flex-1"
                                        />
                                        <div className="w-16">
                                            <Input
                                                type="number"
                                                value={settings.criticalThreshold}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, criticalThreshold: Number.parseInt(e.target.value) || 0 })
                                                }
                                                disabled={!settings.enabled}
                                                min={80}
                                                max={99}
                                                step={1}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Translation Cache</Label>
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <p>Enable Translation Caching</p>
                                        <p className="text-sm text-muted-foreground">
                                            Store translations to reduce API calls and character usage
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.cacheEnabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, cacheEnabled: checked })}
                                        disabled={!settings.enabled}
                                    />
                                </div>

                                <div className="pt-2">
                                    <Label htmlFor="cache-ttl">Cache Duration (hours)</Label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Slider
                                            id="cache-ttl"
                                            min={1}
                                            max={168} // 7 days
                                            step={1}
                                            value={[settings.cacheTTL]}
                                            onValueChange={(value) => setSettings({ ...settings, cacheTTL: value[0] })}
                                            disabled={!settings.enabled || !settings.cacheEnabled}
                                            className="flex-1"
                                        />
                                        <div className="w-16">
                                            <Input
                                                type="number"
                                                value={settings.cacheTTL}
                                                onChange={(e) => setSettings({ ...settings, cacheTTL: Number.parseInt(e.target.value) || 1 })}
                                                disabled={!settings.enabled || !settings.cacheEnabled}
                                                min={1}
                                                max={168}
                                                step={1}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {settings.cacheTTL === 24
                                            ? "Translations will be cached for 1 day"
                                            : settings.cacheTTL < 24
                                                ? `Translations will be cached for ${settings.cacheTTL} hours`
                                                : `Translations will be cached for ${(settings.cacheTTL / 24).toFixed(1)} days`}
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button variant="outline" onClick={clearCache} disabled={!settings.enabled || !settings.cacheEnabled}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear Translation Cache
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Languages Tab */}
                <TabsContent value="languages" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Language Settings</CardTitle>
                            <CardDescription>Configure available languages and default language</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="default-language">Default Language</Label>
                                <p className="text-sm text-muted-foreground">
                                    The default language of your website content (no translation needed)
                                </p>
                                <select
                                    id="default-language"
                                    value={settings.defaultLanguage}
                                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as Language })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                    disabled={!settings.enabled}
                                >
                                    {languageOptions.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name} ({lang.code.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Available Languages</Label>
                                <p className="text-sm text-muted-foreground">
                                    Select which languages will be available in the language switcher
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                                    {languageOptions.map((lang) => {
                                        const isDefault = lang.code === settings.defaultLanguage
                                        const isEnabled = settings.availableLanguages.includes(lang.code)
                                        return (
                                            <div
                                                key={lang.code}
                                                className={`flex items-center justify-between p-3 rounded-md border ${
                                                    isDefault
                                                        ? "bg-orange-50 border-orange-200"
                                                        : isEnabled
                                                            ? "bg-white border-gray-200"
                                                            : "bg-gray-50 border-gray-200"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                          <span className="text-xl" role="img" aria-label={lang.name}>
                            {lang.flag}
                          </span>
                                                    <span>{lang.name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    {isDefault && <Badge className="mr-2 bg-orange-500">Default</Badge>}
                                                    <Switch
                                                        checked={isEnabled}
                                                        onCheckedChange={() => toggleLanguage(lang.code)}
                                                        disabled={!settings.enabled || isDefault}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
