/**
 * Version History & Content Versioning
 * Tracks all versions of generated content for comparison and rollback
 */

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  content: string;
  platform: string;

  // Metadata
  createdBy?: string;
  createdAt: string;
  status: 'draft' | 'approved' | 'published' | 'archived';

  // Quality metrics at time of creation
  bfsScore?: number;
  linterPassed: boolean;
  complianceIssuesCount: number;

  // Change tracking
  changeType: 'created' | 'regenerated' | 'edited' | 'approved' | 'published';
  changeReason?: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];

  // Metadata
  metadata?: {
    agentType?: string;
    regenerationCount?: number;
    tags?: string[];
    notes?: string;
  };
}

export interface VersionDiff {
  versionA: ContentVersion;
  versionB: ContentVersion;

  // Diff information
  type: 'content' | 'metadata' | 'status' | 'quality';
  similarity: number; // 0-1, how similar the versions are
  changeSize: number; // Number of characters changed

  // Detailed diff
  additions: string[];
  deletions: string[];
  unchanged: string[];

  // Quality comparison
  bfsScoreChange?: number;
  complianceIssuesChange?: number;
}

class VersionHistoryService {
  private versions = new Map<string, ContentVersion[]>();
  private versionCounter = new Map<string, number>();

  /**
   * Create a new version of content
   */
  createVersion(
    contentId: string,
    content: string,
    changeType: ContentVersion['changeType'],
    metadata: Partial<ContentVersion>
  ): ContentVersion {
    const counter = (this.versionCounter.get(contentId) || 0) + 1;
    this.versionCounter.set(contentId, counter);

    const version: ContentVersion = {
      id: `v${counter}_${contentId}_${Date.now()}`,
      contentId,
      version: counter,
      content,
      platform: metadata.platform || 'unknown',
      createdAt: new Date().toISOString(),
      status: metadata.status || 'draft',
      changeType,
      linterPassed: metadata.linterPassed ?? true,
      complianceIssuesCount: metadata.complianceIssuesCount ?? 0,
      bfsScore: metadata.bfsScore,
      changeReason: metadata.changeReason,
      createdBy: metadata.createdBy,
      metadata: metadata.metadata
    };

    if (!this.versions.has(contentId)) {
      this.versions.set(contentId, []);
    }

    this.versions.get(contentId)!.push(version);
    return version;
  }

  /**
   * Get all versions of a content
   */
  getVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(contentId: string, versionNumber: number): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.version === versionNumber) || null;
  }

  /**
   * Get the latest version
   */
  getLatestVersion(contentId: string): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  /**
   * Compare two versions
   */
  compareVersions(
    contentId: string,
    versionA: number,
    versionB: number
  ): VersionDiff | null {
    const verA = this.getVersion(contentId, versionA);
    const verB = this.getVersion(contentId, versionB);

    if (!verA || !verB) return null;

    const diff = this.calculateDiff(verA.content, verB.content);
    const similarity = this.calculateSimilarity(verA.content, verB.content);

    return {
      versionA: verA,
      versionB: verB,
      type: 'content',
      similarity,
      changeSize: diff.additions.join('').length + diff.deletions.join('').length,
      additions: diff.additions,
      deletions: diff.deletions,
      unchanged: diff.unchanged,
      bfsScoreChange: verB.bfsScore && verA.bfsScore ? verB.bfsScore - verA.bfsScore : undefined,
      complianceIssuesChange: verB.complianceIssuesCount - verA.complianceIssuesCount
    };
  }

  /**
   * Get versions within a date range
   */
  getVersionsInRange(
    contentId: string,
    startDate: Date,
    endDate: Date
  ): ContentVersion[] {
    const versions = this.versions.get(contentId) || [];
    const start = startDate.getTime();
    const end = endDate.getTime();

    return versions.filter(v => {
      const time = new Date(v.createdAt).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Get versions by change type
   */
  getVersionsByChangeType(
    contentId: string,
    changeType: ContentVersion['changeType']
  ): ContentVersion[] {
    const versions = this.versions.get(contentId) || [];
    return versions.filter(v => v.changeType === changeType);
  }

  /**
   * Archive a version
   */
  archiveVersion(contentId: string, versionNumber: number): boolean {
    const version = this.getVersion(contentId, versionNumber);
    if (version) {
      version.status = 'archived';
      return true;
    }
    return false;
  }

  /**
   * Rollback to a previous version
   */
  rollbackToVersion(
    contentId: string,
    versionNumber: number,
    reason: string
  ): ContentVersion | null {
    const sourceVersion = this.getVersion(contentId, versionNumber);
    if (!sourceVersion) return null;

    return this.createVersion(
      contentId,
      sourceVersion.content,
      'created',
      {
        platform: sourceVersion.platform,
        bfsScore: sourceVersion.bfsScore,
        linterPassed: sourceVersion.linterPassed,
        complianceIssuesCount: sourceVersion.complianceIssuesCount,
        changeReason: `Rollback from v${versionNumber}: ${reason}`,
        metadata: {
          ...sourceVersion.metadata,
          notes: `Restored from version ${versionNumber}`
        }
      }
    );
  }

  /**
   * Calculate similarity between two texts (0-1)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }

  /**
   * Simple diff calculation
   */
  private calculateDiff(oldText: string, newText: string) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const additions: string[] = [];
    const deletions: string[] = [];
    const unchanged: string[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine === newLine) {
        unchanged.push(oldLine);
      } else {
        if (oldLine) deletions.push(oldLine);
        if (newLine) additions.push(newLine);
      }
    }

    return { additions, deletions, unchanged };
  }
}

export const versionHistoryService = new VersionHistoryService();
