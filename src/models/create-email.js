const exec = require('child_process').exec

function p (id) {
  return new Promise(function (resolve, reject) {
    const command = `/usr/sbin/useradd -s /bin/false -G mail -m -N -p "$(mkpasswd --method=sha-512 'C1sco12345')" ${id}`
    exec(command, function (err, stdout, stderr) {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports = p
