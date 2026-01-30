# VideoUploadNode Integration

Этот файл описывает как должен работать VideoUploadNode (аналог FileUploadNode для видео).

## Структура

```
video-upload-node/
├── video-upload-node-extension.ts
├── video-upload-node.tsx
└── index.tsx
```

## video-upload-node-extension.ts

```typescript
import { Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { VideoUploadNodeComponent } from "./video-upload-node"

export const VideoUploadNode = Node.create({
  name: "videoUpload",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      accept: { default: "video/*" },
      maxSize: { default: 100 * 1024 * 1024 }, // 100MB
      targetVideoNodePos: { default: null }, // Позиция video ноды для обновления
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoUploadNodeComponent)
  },

  addOptions() {
    return {
      upload: undefined, // Функция загрузки
    }
  }
})
```

## video-upload-node.tsx

```typescript
export const VideoUploadNodeComponent: React.FC<NodeViewProps> = (props) => {
  const { targetVideoNodePos } = props.node.attrs
  
  const handleUpload = async (files: File[]) => {
    const urls = await uploadFiles(files)
    
    if (urls.length > 0) {
      const videoUrl = urls[0]
      const pos = props.getPos()
      
      // Создать HTML5 video тег
      const videoHTML = `
        <video controls width="100%">
          <source src="${videoUrl}" type="${files[0].type}">
          Your browser does not support the video tag.
        </video>
      `
      
      // Найти video node по позиции
      if (typeof targetVideoNodePos === "number") {
        const videoNode = props.editor.state.doc.nodeAt(targetVideoNodePos)
        
        if (videoNode && videoNode.type.name === "video") {
          // Обновить content video ноды (append)
          props.editor
            .chain()
            .focus()
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const newContent = videoNode.attrs.content + videoHTML
                tr.setNodeMarkup(targetVideoNodePos, undefined, {
                  ...videoNode.attrs,
                  content: newContent
                })
              }
              return true
            })
            .run()
        }
      }
      
      // Удалить upload node
      if (typeof pos === "number") {
        props.editor
          .chain()
          .deleteRange({ from: pos, to: pos + props.node.nodeSize })
          .run()
      }
    }
  }
  
  // Остальная логика как в FileUploadNode
  return (
    <NodeViewWrapper>
      <div>Загрузить видео...</div>
    </NodeViewWrapper>
  )
}
```

## Использование в simple-editor.tsx

```typescript
import { VideoNode } from "@/components/tiptap-node/video-node"
import { VideoUploadNode } from "@/components/tiptap-node/video-upload-node"
import { VideoButton } from "@/components/tiptap-ui/video-button"

const editor = useEditor({
  extensions: [
    // ...
    VideoNode,
    VideoUploadNode.configure({
      accept: "video/*",
      maxSize: 100 * 1024 * 1024,
      upload: handleVideoUpload, // Функция загрузки видео
    }),
  ]
})

// В toolbar:
<VideoButton />
```

## Флоу

1. Пользователь нажимает VideoButton → вставляется video node
2. В video node textarea или кнопка "Загрузить видео"
3. Клик "Загрузить" → вставляется videoUpload node с targetVideoNodePos
4. videoUpload загружает файл → получает URL
5. Создает HTML5 video тег
6. Находит video node по targetVideoNodePos
7. Апдейтит его content (append video HTML)
8. Удаляет себя (videoUpload node)

## Пример результата

После загрузки в video node.attrs.content:
```html
<video controls width="100%">
  <source src="https://cdn.com/video.mp4" type="video/mp4">
</video>
```

Можно добавлять несколько видео подряд - они будут append'иться к content.
