import { FoldingRange, FoldingRangeProvider, ProviderResult, TextDocument, workspace, FoldingRangeKind, WorkspaceConfiguration } from 'vscode'

type FoldingConfig = {
	commentsEnabled: boolean;
	commentsLength: number;
	commentsRegexes: Array<FoldingRegex>;

	regionsEnabled: boolean;
	regionsLength: number;
	regionsRegexes: Array<FoldingRegex>;
}

type FoldingRegex = {
	begin: RegExp,
	end: RegExp
}

export class ExplicitFoldingProvider implements FoldingRangeProvider {
	private languages: { [languageId: string]: FoldingConfig | null | boolean } = {};
	
	readonly id: string = 'explicit';
	
	constructor() {
		workspace.onDidChangeConfiguration(() => {
			this.languages = {};
		});
	}
	
	private addComment(config: FoldingConfig, configuration: any) {
		if (typeof configuration === 'object' && typeof configuration.begin === 'string' && typeof configuration.end === 'string') {
			config.commentsEnabled = true;
			config.commentsLength++;
			config.commentsRegexes.push({
				begin: new RegExp(configuration.begin),
				end: new RegExp(configuration.end)
			});
		}
	}
	
	private addRegion(config: FoldingConfig, configuration: any) {
		if (typeof configuration === 'object' && typeof configuration.begin === 'string' && typeof configuration.end === 'string') {
			config.regionsEnabled = true;
			config.regionsLength++;
			config.regionsRegexes.push({
				begin: new RegExp(configuration.begin),
				end: new RegExp(configuration.end)
			});
		}
	}
	
	private configure(languageId: string, configuration: WorkspaceConfiguration): FoldingConfig {
		const config: FoldingConfig = {
			commentsEnabled: false,
			commentsLength: 0,
			commentsRegexes: [],
			regionsEnabled: false,
			regionsLength: 0,
			regionsRegexes: []
		}
		
		if (typeof configuration === 'object') {
			if (configuration.regions instanceof Array) {
				for (let marker of configuration.regions) {
					this.addRegion(config, marker);
				}
			} else {
				this.addRegion(config, configuration.regions);
			}
			
			if (configuration.comments instanceof Array) {
				for (let marker of configuration.comments) {
					this.addComment(config, marker);
				}
			} else {
				this.addComment(config, configuration.comments);
			}
		}
		
		this.languages[languageId] = config;
		
		return config;
	}
	
	private confirmCommentRange(document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, marker: FoldingRegex): number {
		let i = foldingRangeStart + 1;
		
		while (i < lineCount) {
			if(marker.end.test(document.lineAt(i).text)) {
				foldingRanges.push(new FoldingRange(foldingRangeStart, i, FoldingRangeKind.Comment));
				
				return i + 1;
			} else {
				i++;
			}
		}
		
		return i;
	}
	
	private confirmRegionRange(config: FoldingConfig, document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, marker: FoldingRegex): number {
		let i = foldingRangeStart + 1;
		let line, j;
		
		while (i < lineCount) {
			line = document.lineAt(i).text;
			if ((j = this.findRegionRange(config, document, lineCount, foldingRanges, i, document.lineAt(i).text)) !== i) {
				i = j;
			} else if(marker.end.test(line)) {
				foldingRanges.push(new FoldingRange(foldingRangeStart, i, FoldingRangeKind.Region));
				
				return i + 1;
			} else if (config.commentsEnabled && (j = this.findCommentRange(config, document, lineCount, foldingRanges, i, document.lineAt(i).text)) !== i) {
				i = j;
			} else {
				i++;
			}
		}
		
		return i;
	}
	
	private findCommentRange(config: FoldingConfig, document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, line: string): number {
		for (let i = 0; i < config.commentsLength; i++) {
			if (config.commentsRegexes[i].begin.test(line)) {
				return this.confirmCommentRange(document, lineCount, foldingRanges, foldingRangeStart, config.commentsRegexes[i]);
			}
		}
		
		return foldingRangeStart;
	}
	
	private findRegionRange(config: FoldingConfig, document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, line: string): number {
		for (let i = 0; i < config.regionsLength; i++) {
			if (config.regionsRegexes[i].begin.test(line)) {
				return this.confirmRegionRange(config, document, lineCount, foldingRanges, foldingRangeStart, config.regionsRegexes[i]);
			}
		}
		
		return foldingRangeStart;
	}
	
	private getConfig(document: TextDocument, languageId: string): FoldingConfig {
		if (this.languages[languageId]) {
			return <FoldingConfig> this.languages[languageId];
		}
		
		if (languageId === '*') {
			return this.configure(languageId, workspace.getConfiguration(`explicitFolding.markers`));
		}
		
		if (this.languages[languageId] === false) {
			return this.getConfig(document, '*');
		}
		
		const configuration = workspace.getConfiguration(`[${languageId}]`, document.uri);
		if (typeof configuration === 'object' && configuration['explicitFolding.markers']) {
			return this.configure(languageId, configuration['explicitFolding.markers']);
		} else {
			this.languages[languageId] = false;
		}
		
		return this.getConfig(document, '*');
	}
	
	public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
		const config = this.getConfig(document, document.languageId);
		
		if (!config.commentsEnabled && !config.regionsEnabled) {
			return [];
		}
		
		const foldingRanges: FoldingRange[] = [];
		const lineCount = document.lineCount;
		let i = 0;
		let line, j;
		
		while (i < lineCount) {
			line = document.lineAt(i).text;
			if (config.commentsEnabled && (j = this.findCommentRange(config, document, lineCount, foldingRanges, i, line)) !== i) {
				i = j;
			} else if (config.regionsEnabled && (j = this.findRegionRange(config, document, lineCount, foldingRanges, i, line)) !== i) {
				i = j;
			}
			else {
				i++;
			}
		}
		
		return foldingRanges;
	}
}