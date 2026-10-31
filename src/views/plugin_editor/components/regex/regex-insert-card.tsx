import React, { memo, useState, useCallback, useEffect } from 'react';
import { Button, Textarea, Label } from '@/src/shadcn';
import { ListPlus, Code, Pencil, Search } from 'lucide-react';
import { useRegexStore } from '../..';
import { PluginTranslationV1Regex } from '@/src/types';
import { TemplateCard } from '../common/template-card';
import { useTranslation } from 'react-i18next';

interface RegexAddPanelProps {
    /** 按正则扫描插件源码并批量提取条目 (每项一条表达式) */
    onBatchExtract?: (patterns: string[]) => void;
}

/**
 * 正则新增卡片
 * - 支持 Source/Target 分离
 * - 增加正则语法校验
 * - Target 默认为 Source (当 Target 为空时)
 */
const RegexInsertCard: React.FC<RegexAddPanelProps> = memo(({ onBatchExtract }) => {
    const { t } = useTranslation();
    const [source, setSource] = useState<string>('');
    const [target, setTarget] = useState<string>('');
    const [isValidRegex, setIsValidRegex] = useState<boolean>(true);
    const [extractPattern, setExtractPattern] = useState<string>(() => useRegexStore.getState().extractPatterns.join('\n'));
    const [isValidExtractRegex, setIsValidExtractRegex] = useState<boolean>(true);

    const addRegexItem = useRegexStore((state) => state.addRegexItem);
    const extractPatterns = useRegexStore((state) => state.extractPatterns);

    // 翻译文件中的规则变化时同步到输入框
    useEffect(() => {
        setExtractPattern(extractPatterns.join('\n'));
        setIsValidExtractRegex(true);
    }, [extractPatterns]);

    // 验证正则有效性
    const validateRegex = useCallback((pattern: string) => {
        if (!pattern) return true; // 空时不报错，但禁用按钮
        try {
            new RegExp(pattern);
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    // 处理 Source 输入框变化
    const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setSource(val);
        setIsValidRegex(validateRegex(val));
    }, [validateRegex]);

    // 处理 Target 输入框变化
    const handleTargetChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTarget(e.target.value);
    }, []);

    // 拆分多行规则（每行一个表达式，忽略空行）
    const splitExtractPatterns = useCallback((text: string) => {
        return text.split('\n').map(line => line.trim()).filter(line => line !== '');
    }, []);

    // 验证每行正则是否有效
    const validateExtractPatterns = useCallback((text: string) => {
        for (const line of splitExtractPatterns(text)) {
            try {
                new RegExp(line);
            } catch (e) {
                return false;
            }
        }
        return true;
    }, [splitExtractPatterns]);

    // 处理批量提取正则输入框变化
    const handleExtractPatternChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setExtractPattern(val);
        setIsValidExtractRegex(validateExtractPatterns(val));
    }, [validateExtractPatterns]);

    // 处理批量提取按钮点击
    const handleExtractClick = useCallback(() => {
        const lines = splitExtractPatterns(extractPattern);
        if (lines.length === 0 || !isValidExtractRegex) { return; }
        onBatchExtract?.(lines);
    }, [extractPattern, isValidExtractRegex, onBatchExtract, splitExtractPatterns]);

    // 处理新增按钮点击
    const handleAddClick = useCallback(() => {
        // 允许 Target 为空（默认为 Source），只需验证 Source
        if (!source || !isValidRegex) { return; }

        // 如果 Target 为空，则与 Source 相同
        const finalTarget = target || source;

        const newItem: any = { source: source, target: finalTarget, id: -1 };

        addRegexItem(newItem);
        setSource('');
        setTarget('');
        setIsValidRegex(true);
    }, [source, target, isValidRegex, addRegexItem]);

    // 回车提交（Ctrl+Enter）
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleAddClick();
        }
    }, [handleAddClick]);

    return (
        <TemplateCard
            title={t('Editor.Regex.AddRule')}
            icon={ListPlus}
            className="flex flex-col gap-3"
        >
            <div className="flex flex-col gap-3">
                {/* 正则批量提取 */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5" />
                            {t('Editor.Regex.BatchExtract')}
                        </Label>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExtractClick}
                            disabled={!extractPattern.trim() || !isValidExtractRegex}
                            className="h-6 px-2 text-[11px] gap-1 font-medium text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                            <Search className="w-3 h-3" />
                            {t('Editor.Regex.BatchExtractAction')}
                        </Button>
                    </div>
                    <Textarea
                        id="regex-batch-extract"
                        value={extractPattern}
                        onChange={handleExtractPatternChange}
                        placeholder={t('Editor.Regex.BatchExtractPlaceholder')}
                        className={`text-xs h-16 resize-y bg-background ${!isValidExtractRegex ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}`}
                    />
                    {!isValidExtractRegex && <span className="text-[10px] text-red-500">{t('Editor.Regex.InvalidRegex')}</span>}
                </div>

                {/* Source 输入框 */}
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5" />
                        {t('Editor.Table.ColumnSource')}
                    </Label>
                    <Textarea
                        id="regex-source"
                        value={source}
                        onChange={handleSourceChange}
                        onKeyDown={handleKeyDown}
                        placeholder={t('Editor.Regex.InputRegexPlaceholder')}
                        className={`text-xs h-16 resize-y bg-background ${!isValidRegex ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}`}
                    />
                    {!isValidRegex && <span className="text-[10px] text-red-500">{t('Common.Status.Error')}</span>}
                </div>

                {/* Target 输入框 */}
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        {t('Editor.Table.ColumnTarget')}
                    </Label>
                    <Textarea
                        id="regex-target"
                        value={target}
                        onChange={handleTargetChange}
                        onKeyDown={handleKeyDown}
                        placeholder={source ? t('Editor.Regex.DefaultPlaceholder', { source }) : t('Editor.Regex.InputTargetPlaceholder')}
                        className="text-xs h-16 resize-y border-input bg-background"
                    />
                </div>
            </div>

            {/* 新增按钮 */}
            <Button
                variant="secondary"
                size="sm"
                onClick={handleAddClick}
                disabled={!source || !isValidRegex}
                className="text-xs h-8 gap-1.5 text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95 group w-full mt-1 font-medium"
            >
                <ListPlus className="w-3.5 h-3.5" />
                {t('Editor.Regex.AddRule')}
            </Button>
        </TemplateCard>
    );
});

// 自定义 displayName 便于调试
RegexInsertCard.displayName = 'RegexInsertCard';

export { RegexInsertCard };