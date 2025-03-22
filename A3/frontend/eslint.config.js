import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Custom formatter to change warning color
const customFormatter = {
  name: 'custom-formatter',
  format(results) {
    // ANSI escape codes for colors
    const reset = '\x1b[0m';
    const yellow = '\x1b[33m';
    
    // Process each file's results
    let output = '';
    results.forEach(result => {
      const { filePath, messages } = result;
      if (messages.length === 0) return;
      
      output += `${filePath}\n`;
      
      messages.forEach(message => {
        const { line, column, severity, message: text, ruleId } = message;
        const prefix = severity === 1 ? `${yellow}Warning${reset}` : 'Error';
        const location = `${line}:${column}`;
        output += `  ${location}  ${prefix}  ${text}  ${ruleId || ''}\n`;
      });
      
      output += '\n';
    });
    
    return output;
  }
};

export default tseslint.config(
  { 
    ignores: ['dist'],
    // Add the custom formatter
    formatter: customFormatter
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Make unused vars a warning, not an error
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn'
    },
  },
)
