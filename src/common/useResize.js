// @ https://stackoverflow.com/questions/49469834/recommended-way-to-have-drawer-resizable
import { useCallback, useEffect, useState } from 'react'

const useResize = ({
  minWidth,
  defaultWidth,
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [width, setWidth] = useState(defaultWidth)

  const enableResize = useCallback(() => {
    setIsResizing(true)
  }, [setIsResizing])

  const disableResize = useCallback(() => {
    setIsResizing(false)
  }, [setIsResizing])

  const resize = useCallback(
    (/** @type {MouseEvent}*/e) => {
      if (e.buttons === 0) {
        disableResize();
        return;
      }
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX // You may want to add some offset here from props
        if (newWidth >= minWidth) {
          setWidth(newWidth)
        }
      }
    },
    [minWidth, isResizing, setWidth, disableResize],
  )

  useEffect(() => {
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', disableResize)

    return () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', disableResize)
    }
  }, [disableResize, resize])

  return { width, enableResize }
}

export default useResize