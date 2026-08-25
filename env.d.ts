declare module '*.css' {
  const css: string
  export default css
}

declare module '*.vue' {
  import type { ComponentOptions } from 'vue'

  const comp: ComponentOptions
  export default comp
}
