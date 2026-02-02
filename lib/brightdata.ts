import { bdclient } from "@brightdata/sdk"

export interface BrightDataExperience {
  title: string
  company: string
  location?: string
  start_date?: string
  end_date?: string
  description?: string
}

export interface BrightDataEducation {
  school: string
  degree?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
}

export interface BrightDataLinkedInResult {
  name?: string
  headline?: string
  location?: string
  about?: string
  experience?: BrightDataExperience[]
  education?: BrightDataEducation[]
  skills?: string[]
  certifications?: { name: string; authority?: string }[]
  publications?: { title: string; publisher?: string; date?: string; description?: string }[]
  volunteering?: { role: string; organization: string }[]
  honors?: { title: string; issuer?: string; date?: string; description?: string }[]
  recommendations_count?: number
}

let _client: InstanceType<typeof bdclient> | null = null

function getClient() {
  if (!_client) {
    const apiKey = process.env.BRIGHTDATA_API_KEY
    if (!apiKey) throw new Error("Missing BRIGHTDATA_API_KEY")
    _client = new bdclient({ apiKey })
  }
  return _client
}

/**
 * Scrape a LinkedIn profile via Bright Data SDK.
 */
export async function scrapeLinkedInProfile(url: string): Promise<BrightDataLinkedInResult> {
  const client = getClient()
  const results = await client.datasets.linkedin.collectProfiles([url], { format: "json" })

  if (!results || (Array.isArray(results) && results.length === 0)) {
    throw new Error("Empty result from Bright Data")
  }

  const profile = Array.isArray(results) ? results[0] : results
  return profile as BrightDataLinkedInResult
}
