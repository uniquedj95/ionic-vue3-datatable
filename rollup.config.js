import ts from "rollup-plugin-typescript2"
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json'

function createEntry(options) {
  const config = {
    input: './src/components/DataTable.ts',
    external: [
      'vue',
      'lodash',
      'ionic',
      'ionicons',
      '@ionic/vue'
    ],
    output: {
      name: 'DataTable',
      file: options.file,
      format: options.format,
      exports: 'default',
      globals: {
        vue: 'Vue',
        lodash: 'lodash',
      }
    },
    plugins: [
      ts({
        check: options.format === 'es',
        tsconfigOverride: {
          compilerOptions: {
            declaration: options.format === 'es',
          },
          exclude: ['src', 'example']
        }
      }),
      nodeResolve()
    ]
  }

  return config
}

export default [
  // createEntry({ format: 'iife', file: pkg.browser }),
  createEntry({ format: 'es', file: pkg.module }),
  createEntry({ format: 'cjs', file: pkg.main }),
]
