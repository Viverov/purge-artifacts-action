import * as core from '@actions/core'
import * as github from '@actions/github'
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds'
import {
  getOctokit,
  eachArtifact,
  getActionInputs,
  IActionInputs
} from './utils'

export function shouldDelete(
  artifact: ActionsListArtifactsForRepoResponseArtifactsItem,
  actionInputs: IActionInputs
): boolean {
  let result = true
  if (actionInputs.expireInMs !== undefined) {
    result =
      result &&
      differenceInMilliseconds(new Date(), new Date(artifact.created_at)) >=
        actionInputs.expireInMs
  }
  if (actionInputs.pattern !== undefined) {
    result = result && new RegExp(actionInputs.pattern).test(artifact.name)
  }
  return result
}

export async function main(): Promise<void> {
  try {
    const actionInputs = getActionInputs()

    const octokit = getOctokit()

    const deletedArtifacts = []
    for await (const artifact of eachArtifact(octokit)) {
      if (shouldDelete(artifact, actionInputs)) {
        deletedArtifacts.push(artifact)
        core.debug(`Deleting artifact:\n${JSON.stringify(artifact, null, 2)}`)
        await octokit.actions.deleteArtifact({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          // eslint-disable-next-line @typescript-eslint/camelcase
          artifact_id: artifact.id
        })
      }
    }
    core.setOutput('deleted-artifacts', JSON.stringify(deletedArtifacts))
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
