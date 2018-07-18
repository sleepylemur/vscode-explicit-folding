import { FoldingRange, FoldingRangeProvider, ProviderResult, TextDocument, workspace, FoldingRangeKind } from 'vscode'

type FoldingRegex = {
	begin: RegExp,
	end: RegExp
}

export class ExplicitFoldingProvider implements FoldingRangeProvider {
	private commentsEnabled: boolean = false;
	private commentsLength: number = 0;
	private commentsRegexes: Array<FoldingRegex> = [];

	private regionsEnabled: boolean = false;
	private regionsLength: number = 0;
	private regionsRegexes: Array<FoldingRegex> = [];
	
	readonly id: string = 'explicit';
	
	constructor() {
		this.configure();
		
		workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('explicitFolding.markers')) {
				this.configure();
			}
		});
	}
	
	private addComment(configuration: any) {
		if (typeof configuration === 'object' && typeof configuration.begin === 'string' && typeof configuration.end === 'string') {
			this.commentsEnabled = true;
			this.commentsLength++;
			this.commentsRegexes.push({
				begin: new RegExp(configuration.begin),
				end: new RegExp(configuration.end)
			});
		}
	}
	
	private addRegion(configuration: any) {
		if (typeof configuration === 'object' && typeof configuration.begin === 'string' && typeof configuration.end === 'string') {
			this.regionsEnabled = true;
			this.regionsLength++;
			this.regionsRegexes.push({
				begin: new RegExp(configuration.begin),
				end: new RegExp(configuration.end)
			});
		}
	}
	
	private configure() {
		const configuration = workspace.getConfiguration('explicitFolding.markers');
		
		if (typeof configuration === 'object') {
			if (configuration.regions instanceof Array) {
				for (let marker of configuration.regions) {
					this.addRegion(marker);
				}
			} else {
				this.addRegion(configuration.regions);
			}
			
			if (configuration.comments instanceof Array) {
				for (let marker of configuration.comments) {
					this.addComment(marker);
				}
			} else {
				this.addComment(configuration.comments);
			}
		}
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
	
	private confirmRegionRange(document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, marker: FoldingRegex): number {
		let i = foldingRangeStart + 1;
		let line, j;
		
		while (i < lineCount) {
			line = document.lineAt(i).text;
			if ((j = this.findRegionRange(document, lineCount, foldingRanges, i, document.lineAt(i).text)) !== i) {
				i = j;
			} else if(marker.end.test(line)) {
				foldingRanges.push(new FoldingRange(foldingRangeStart, i, FoldingRangeKind.Region));
				
				return i + 1;
			} else if (this.commentsEnabled && (j = this.findCommentRange(document, lineCount, foldingRanges, i, document.lineAt(i).text)) !== i) {
				i = j;
			} else {
				i++;
			}
		}
		
		return i;
	}
	
	private findCommentRange(document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, line: string): number {
		for (let i = 0; i < this.commentsLength; i++) {
			if (this.commentsRegexes[i].begin.test(line)) {
				return this.confirmCommentRange(document, lineCount, foldingRanges, foldingRangeStart, this.commentsRegexes[i]);
			}
		}
		
		return foldingRangeStart;
	}
	
	private findRegionRange(document: TextDocument, lineCount: number, foldingRanges: FoldingRange[], foldingRangeStart: number, line: string): number {
		for (let i = 0; i < this.regionsLength; i++) {
			if (this.regionsRegexes[i].begin.test(line)) {
				return this.confirmRegionRange(document, lineCount, foldingRanges, foldingRangeStart, this.regionsRegexes[i]);
			}
		}
		
		return foldingRangeStart;
	}
	
	public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
		if (!this.commentsEnabled && !this.regionsEnabled) {
			return [];
		}
		
		const foldingRanges: FoldingRange[] = [];
		const lineCount = document.lineCount;
		let i = 0;
		let line, j;
		
		while (i < lineCount) {
			line = document.lineAt(i).text;
			if (this.commentsEnabled && (j = this.findCommentRange(document, lineCount, foldingRanges, i, line)) !== i) {
				i = j;
			} else if (this.regionsEnabled && (j = this.findRegionRange(document, lineCount, foldingRanges, i, line)) !== i) {
				i = j;
			}
			else {
				i++;
			}
		}
		
		return foldingRanges;
	}
}