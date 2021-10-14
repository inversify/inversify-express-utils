module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    warnOnUnsupportedTypeScriptVersion: false,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
  },
  rules: {
    'arrow-parens': ['error', 'as-needed', {
      requireForBlockBody: false,
    }],
    'class-methods-use-this': 'off',
    'constructor-super': 'error',
    'handle-callback-err': 'error',
    'no-await-in-loop': 'off',
    'no-class-assign': 'error',
    'no-continue': 'off',
    'import/no-cycle': 'off',
    'no-mixed-operators': ['error', {
      allowSamePrecedence: true,
    }],
    'no-mixed-requires': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',
    'no-restricted-syntax': ['error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-this-before-super': 'error',
    'no-underscore-dangle': 'off',
    'prefer-destructuring': ['error', {
      'VariableDeclarator': {
        array: false,
        object: true,
      },
      'AssignmentExpression': {
        array: false,
        object: true,
      }
    }, {
        enforceForRenamedProperties: false,
      }],
    'strict': ['error', 'global'],
    'template-curly-spacing': ['error', 'always'],

    'import/named': 'error',
    'import/prefer-default-export': 'off',

    '@typescript-eslint/array-type': ['error', {
      default: 'generic',
    }],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
    }],
    '@typescript-eslint/explicit-member-accessibility': ['error', {
      'overrides': {
        constructors: 'no-public',
      }
    }],
    '@typescript-eslint/explicit-module-boundary-types': ['error', {
      allowArgumentsExplicitlyTypedAsAny: true,
    }],
    '@typescript-eslint/indent': ['error', 4, {
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      MemberExpression: 0,
      FunctionDeclaration: {
        parameters: 1,
        body: 1,
      },
      FunctionExpression: {
        parameters: 1,
        body: 1,
      },
      CallExpression: {
        arguments: 1,
      },
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      flatTernaryExpressions: false,
      ignoredNodes: [
        'JSXExpressionContainer > ConditionalExpression'
      ],
      ignoreComments: false,
    }],
    '@typescript-eslint/lines-between-class-members': ['error', 'always', {
      exceptAfterSingleLine: true,
    }],
    '@typescript-eslint/naming-convention': [
      "error",
      {
        selector: ['enum'],
        format: ['UPPER_CASE'],
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
    }],
    '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
    '@typescript-eslint/object-curly-spacing': ['error', 'never'],
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/unbound-method': 'error',
  },
};
