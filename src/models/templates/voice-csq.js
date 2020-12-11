module.exports = function ({name, userId, skillRefUrl}) {
  return {
    name,
    queueType: 'VOICE',
    queueAlgorithm: 'FIFO',
    autoWork: true,
    wrapupTime: 1,
    resourcePoolType: 'SKILL_GROUP',
    serviceLevel: 5,
    serviceLevelPercentage: 70,
    poolSpecificInfo: {
      skillGroup: {
        skillCompetency: [{
          competencelevel: 5,
          skillNameUriPair:{
            '@name': name,
            refURL: skillRefUrl
          },
          weight: 1,
        }],
        selectionCriteria:'Longest Available'
      }
    }
  }
}
