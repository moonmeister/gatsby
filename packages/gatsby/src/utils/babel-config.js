/* @flow */

const fs = require(`fs`)
const path = require(`path`)
const json5 = require(`json5`)
const _ = require(`lodash`)
const report = require(`gatsby-cli/lib/reporter`)

const apiRunnerNode = require(`./api-runner-node`)
const testRequireError = require(`./test-require-error`).default
const { actions } = require(`../redux/actions`)
const { store } = require(`../redux`)

const buildConfig = (abstractConfig, babelOptions, stage) => {
  let babelrc = {
    ...babelOptions,
    presets: [],
    plugins: [],
  }

  abstractConfig.presets.forEach(p =>
    babelrc.presets.push([require.resolve(p.name), p.options])
  )
  abstractConfig.plugins.forEach(p =>
    babelrc.plugins.push([require.resolve(p.name), p.options])
  )

  if (!babelrc.hasOwnProperty(`cacheDirectory`)) {
    babelrc.cacheDirectory = true
  }

  if (stage === `develop`) {
    // TODO: maybe this should be left to the user?
    babelrc.plugins.unshift(require.resolve(`react-hot-loader/babel`))
  }

  // Make dynamic imports work during SSR.
  if (stage === `build-html` || stage === `develop-html`) {
    babelrc.plugins.unshift(require.resolve(`babel-plugin-dynamic-import-node`))
  }

  babelrc.plugins.unshift(
    require.resolve(`babel-plugin-remove-graphql-queries`)
  )

  return babelrc
}

exports.buildConfig = buildConfig

/**
 * Returns a normalized Babel config to use with babel-loader. All of
 * the paths will be absolute so that Babel behaves as expected.
 */
exports.createBabelConfig = async function babelConfig(program, stage) {
  await apiRunnerNode(`onCreateBabelConfig`, { stage })
  const babelrcState = store.getState().babelrc
  let babelrc = buildConfig(
    babelrcState.stages[stage],
    babelrcState.options,
    stage
  )

  return babelrc
}
