export const getMemberPersonalTrainingTitle = (trainerName?: string | null) => {
  const name = String(trainerName ?? '').trim()
  return name ? `Personal Training with ${name}` : 'Personal Training Session'
}

export const getOwnerPersonalTrainingTitle = (trainerName?: string | null) => {
  const name = String(trainerName ?? '').trim()
  return name ? `${name} — Personal Training` : 'Personal Training Session'
}
