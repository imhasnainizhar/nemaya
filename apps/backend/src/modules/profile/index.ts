import { Module } from "@medusajs/framework/utils"
import ProfileModuleService from "./service"

export const PROFILE_MODULE = "profile"

export default Module(PROFILE_MODULE, {
  service: ProfileModuleService,
})
