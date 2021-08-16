import { main, shouldDelete } from '../src/main'
import { sub } from 'date-fns'
import { IActionInputs } from '../src/utils'

describe('shouldDelete', () => {
  test('expired', () => {
    const days = 2
    const expireInMs = days * 86400000
    const expiredArtifact = { created_at: sub(new Date(), { days }) }
    const actionInput: IActionInputs = { expireInMs }
    expect(shouldDelete(expiredArtifact as any, actionInput)).toEqual(true)
  })
  test('not expired', () => {
    const days = 2
    const expireInMs = (days + 1) * 86400000
    const expiredArtifact = { created_at: sub(new Date(), { days }) }
    const actionInput: IActionInputs = { expireInMs }
    expect(shouldDelete(expiredArtifact as any, actionInput)).toEqual(false)
  })
  test('expired when expireInDays is zero', () => {
    const expiredArtifact = { created_at: new Date() }
    const actionInput: IActionInputs = { expireInMs: 0 }
    expect(shouldDelete(expiredArtifact as any, actionInput)).toEqual(true)
  })
  test('matched by pattern', () => {
    const matchedArtifact = { name: 'file-v123' }
    const actionInput: IActionInputs = { pattern: 'file-.+$' }
    expect(shouldDelete(matchedArtifact as any, actionInput)).toEqual(true)
  })
  test('not matched by pattern', () => {
    const matchedArtifact = { name: 'not-v123' }
    const actionInput: IActionInputs = { pattern: 'file-.+$' }
    expect(shouldDelete(matchedArtifact as any, actionInput)).toEqual(false)
  })
})
