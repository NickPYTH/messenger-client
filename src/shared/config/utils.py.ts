export const isLikelyCode = (text: string): boolean => {
    // Если текст слишком короткий, скорее всего это не код
    if (text.length < 10) return false;

    // Убираем пробелы в начале и конце для анализа
    const trimmedText = text.trim();

    // 1. Проверка на наличие явных маркеров кода
    const codeMarkers = [
        /^```[\s\S]*```$/, // Блоки кода в тройных кавычках
        /^`[^`]+`$/, // Код в одинарных кавычках
        /^(import|export|function|class|def|let|const|var|if|for|while|return|package|public|private)\b/,
        /^(<!DOCTYPE|<html|<div|<script|<style|<\?php)/, // HTML/XML/PHP
        /^[\s]*[{}[\];]+/, // Начинается со скобок или точки с запятой
    ];

    if (codeMarkers.some((pattern) => pattern.test(trimmedText))) {
        return true;
    }

    // 2. Подсчет специальных символов (индикаторы кода)
    const codeSymbols = /[{}[\];()=<>+\-*/%&|^~!]/g;
    const symbolMatches = trimmedText.match(codeSymbols) || [];
    const symbolRatio = symbolMatches.length / trimmedText.length;

    // 3. Подсчет ключевых слов программирования
    const keywords = [
        'function',
        'class',
        'interface',
        'module',
        'import',
        'export',
        'const',
        'let',
        'var',
        'if',
        'else',
        'for',
        'while',
        'return',
        'try',
        'catch',
        'finally',
        'throw',
        'new',
        'this',
        'async',
        'await',
        'public',
        'private',
        'protected',
        'static',
        'void',
        'int',
        'string',
        'boolean',
        'null',
        'undefined',
        'true',
        'false',
        'console',
        'log',
    ];

    const keywordCount = keywords.reduce((count, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        return count + (trimmedText.match(regex) || []).length;
    }, 0);

    // 4. Проверка структуры (много строк, отступы)
    const lines = trimmedText.split('\n');
    const lineCount = lines.length;
    const avgLineLength = trimmedText.length / lineCount;

    // Проверяем отступы в коде
    const linesWithIndent = lines.filter((line) => /^\s{2,}/.test(line)).length;
    const indentRatio = linesWithIndent / lineCount;

    // 5. Вычисляем общую вероятность
    let score = 0;

    // Высокое соотношение символов кода (более 15%)
    if (symbolRatio > 0.15) score += 40;
    else if (symbolRatio > 0.08) score += 20;

    // Наличие ключевых слов
    if (keywordCount >= 3) score += 30;
    else if (keywordCount >= 1) score += 15;

    // Многострочная структура с отступами
    if (lineCount >= 3 && indentRatio > 0.5) score += 20;

    // Средняя длина строки (код обычно имеет короткие строки)
    if (avgLineLength < 60 && avgLineLength > 10) score += 10;

    // 6. Исключаем явно не код
    // Проверяем на обычный текст (много пробелов, мало символов кода)
    const wordCount = trimmedText.split(/\s+/).length;
    const wordToSymbolRatio = wordCount / (symbolMatches.length || 1);

    if (wordToSymbolRatio > 5 && symbolRatio < 0.05) {
        score -= 30; // Скорее всего это обычный текст
    }

    // Проверяем на JSON
    if (/^{.*}$|^\[.*\]$/s.test(trimmedText)) {
        try {
            JSON.parse(trimmedText);
            score += 50; // Это точно JSON
        } catch {
            // Не валидный JSON, но похож
            if (trimmedText.includes('":')) score += 30;
        }
    }

    return score >= 50; // Пороговое значение
};

// Функция для автоформатирования кода (добавляет обертку если нужно)
const autoFormatCode = (text: string): string => {
    if (!isLikelyCode(text)) return text;

    const trimmedText = text.trim();

    // Если уже есть обратные кавычки, возвращаем как есть
    if (/^`.*`$/.test(trimmedText) || /^```[\s\S]*```$/.test(trimmedText)) {
        return trimmedText;
    }

    // Определяем язык программирования
    const detectLanguage = (): string => {
        if (/<\?php|namespace\s|use\s[A-Z]/.test(trimmedText)) return 'php';
        if (/import\sReact|export\sdefault|\.tsx?$/.test(trimmedText)) return 'typescript';
        if (/import\s|from\s|\.jsx?$/.test(trimmedText)) return 'javascript';
        if (/def\s|class\s.*:|import\s|\.py$/.test(trimmedText)) return 'python';
        if (/package\s|public\sclass|System\.|\.java$/.test(trimmedText)) return 'java';
        if (/func\s|package\s|import\s"|\.go$/.test(trimmedText)) return 'go';
        if (/<\?|<html|<!DOCTYPE|div\s|class=|\.html?$/.test(trimmedText)) return 'html';
        if (/{|}\s*;|@media|\.css$/.test(trimmedText)) return 'css';
        if (/CREATE\s|SELECT\s|INSERT\s|UPDATE\s/.test(trimmedText)) return 'sql';
        if (/^{.*}$|^\[.*\]$/.test(trimmedText) && trimmedText.includes('":')) return 'json';

        // По умолчанию пытаемся угадать по расширению в комментарии
        const extensionMatch = trimmedText.match(/\.(\w+)$/);
        if (extensionMatch) {
            const ext = extensionMatch[1];
            const langMap: Record<string, string> = {
                js: 'javascript',
                ts: 'typescript',
                py: 'python',
                java: 'java',
                go: 'go',
                rs: 'rust',
                cpp: 'cpp',
                c: 'c',
                cs: 'csharp',
                php: 'php',
                rb: 'ruby',
                swift: 'swift',
            };
            return langMap[ext] || 'text';
        }

        return 'text';
    };

    const language = detectLanguage();
    return `\`\`\`${language}\n${trimmedText}\n\`\`\``;
};
