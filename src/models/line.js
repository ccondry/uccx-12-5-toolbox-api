module.exports = async function (axl, {
  pattern,
  description,
  alertingName,
  routePartitionName
}) {
  // try to get the line first, if it exists
  let lineUuid

  try {
    console.log(`checking if line ${pattern} exists in route partition ${routePartitionName || '<None>'}`)
    const results = await axl.getLine({
      pattern,
      routePartitionName
      // routePartitionName: 'Everyone'
    })
    // console.log(`line ${pattern} exists. getting UUID.`)
    // get line uuid
    console.log(`results['$'].uuid`, results['$'].uuid)
    lineUuid = results['$'].uuid.slice(1, results['$'].uuid.length - 1)
    console.log(`line ${pattern} exists:`, lineUuid)
  } catch (e) {
    console.log(`line ${pattern} does not exist.`)
    // line doesn't exist - create and continue
    try {
      console.log(`creating line ${pattern}`)
      const results = await axl.addLine({
        pattern,
        description,
        alertingName,
        asciiAlertingName: alertingName,
        routePartitionName
        // routePartitionName: 'Everyone'
      })
      console.log(`created line ${pattern}`)
      // get line uuid
      lineUuid = results.slice(1, results.length - 1)
    } catch (e2) {
      console.log(`failed to create line ${pattern}`, e2)
      throw e2
    }
  }
  console.log(`line ${pattern} UUID = ${lineUuid}`)
  return lineUuid
}
