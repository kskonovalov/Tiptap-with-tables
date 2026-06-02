# CopyToTiptapTune

EditorJS Block Tune — добавляет кнопку «Копировать для Tiptap» в меню каждого блока.

## Установка

Скопируй `copy-to-tiptap-tune.ts` в свой EditorJS-проект.

## Подключение

```ts
import EditorJS from '@editorjs/editorjs';
import { CopyToTiptapTune } from './copy-to-tiptap-tune';

const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    copyToTiptap: {
      class: CopyToTiptapTune,
    },
  },
});
```

## Использование

1. Кликни на любой блок — слева появится иконка настроек (⋮ или шестерёнка).
2. Открой меню блока.
3. Нажми «Копировать для Tiptap».
4. Перейди в Tiptap-редактор и нажми **Ctrl+V** / **Cmd+V**.

Tune копирует только тот блок, в котором ты находишься.

## Как это работает

Tune кладёт в буфер обмена строку вида:

```
editorjs-tiptap::{"blocks":[{ "id": "...", "type": "paragraph", "data": { ... } }]}
```

Tiptap-редактор в `handlePaste` проверяет этот префикс, парсит JSON и вставляет блок через встроенный мигратор `editorjsToTiptap`.
