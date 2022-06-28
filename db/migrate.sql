-- MySQL Script generated by MySQL Workbench
-- Tue Jun 28 22:11:49 2022
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema deeplinks
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema deeplinks
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `deeplinks` DEFAULT CHARACTER SET utf8 ;
USE `deeplinks` ;

-- -----------------------------------------------------
-- Table `deeplinks`.`websites`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `deeplinks`.`websites` (
  `id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT '__uncharted',
  `contents` TEXT NOT NULL DEFAULT '__uncharted',
  `last_visited` DECIMAL(13,0) NOT NULL DEFAULT 0,
  `url` VARCHAR(255) NOT NULL,
  `banned` TINYINT(1) NOT NULL DEFAULT 0,
  `discovery_site` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `url_UNIQUE` (`url` ASC) )
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `deeplinks`.`websites`
-- -----------------------------------------------------
START TRANSACTION;
USE `deeplinks`;
INSERT INTO `deeplinks`.`websites` (`id`, `title`, `contents`, `last_visited`, `url`, `banned`, `discovery_site`) VALUES (null, 'null', 'null', 0, 'http://jgwe5cjqdbyvudjqskaajbfibfewew4pndx52dye7ug3mt3jimmktkid.onion', 0, '__origin');

COMMIT;

