import Device from "../models/Device.js";
import BlockRule from "../models/BlockRule.js";


export async function heartbeat(req, res) {
  try {
    const { hostname, os, osVersion, ipAddress, openPorts, antivirus } = req.body;

    const blocked = await BlockRule.findOne({
      active: true,
      $or: [{ hostname }, { ipAddress }]
    });
    if (blocked) {
      return res.status(403).json({ error: "Device is blocked", reason: blocked.reason });
    }

    const device = await Device.findOneAndUpdate(
      { userId: req.user.id, hostname },
      {
        userId: req.user.id,
        hostname, os, osVersion, ipAddress, openPorts, antivirus,
        lastSeen: new Date(),
        status: "online",
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({ ok: true, deviceId: device._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getDevices(req, res) {
  try {
    const devices = await Device.find({});
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}