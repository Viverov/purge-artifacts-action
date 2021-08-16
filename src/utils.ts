import { Octokit } from '@octokit/core'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { RestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/types'
import parseDuration from 'parse-duration'

/*
  We need to create our own github client because @actions/core still uses
  old version of @octokit/plugin-rest-endpoint-methods which doesn't have
  `.listArtifactsForRepo`. This won't be needed when @actions/core gets updated

  This ---------------> https://github.com/actions/toolkit/blob/master/packages/github/package.json#L42
                        https://github.com/octokit/rest.js/blob/master/package.json#L38
  Neeeds to use this -> https://github.com/octokit/plugin-rest-endpoint-methods.js/pull/45
*/
export function getOctokit(): Octokit & RestEndpointMethods {
  const token = core.getInput('token', { required: true })
  const _Octokit = Octokit.plugin(restEndpointMethods)
  return new _Octokit({ auth: token })
  // return new github.GitHub(token)
}

export async function* eachArtifact(
  octokit: Octokit & RestEndpointMethods
): AsyncGenerator<ActionsListArtifactsForRepoResponseArtifactsItem> {
  let hasNextPage = false
  let currentPage = 1
  const maxPerPage = 100
  do {
    const response = await octokit.actions.listArtifactsForRepo({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      page: currentPage,
      per_page: maxPerPage // eslint-disable-line @typescript-eslint/camelcase
    })
    hasNextPage = response.data.total_count / maxPerPage > currentPage
    for (const artifact of response.data.artifacts) {
      yield artifact
    }
    currentPage++
  } while (hasNextPage)
}

export interface IActionInputs {
  expireInMs?: number
  pattern?: string
}
export function getActionInputs(): IActionInputs {
  const result: IActionInputs = {}

  const expireInHumanReadable = core.getInput('expire-in', { required: false })
  if (expireInHumanReadable !== '') {
    result.expireInMs = parseDuration(expireInHumanReadable)
  }

  const pattern = core.getInput('pattern', { required: false })
  if (pattern !== '') {
    result.pattern = pattern
  }

  if (!expireInHumanReadable && !pattern) {
    throw new Error('"expire-at" or "pattern" must be defined in action params')
  }

  return result
}
