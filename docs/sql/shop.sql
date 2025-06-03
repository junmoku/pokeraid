-- pokeraid.shop definition

CREATE TABLE `shop` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('POKEMON','ITEM') NOT NULL,
  `target_id` int NOT NULL,
  `price` int NOT NULL,
  `stock` int DEFAULT '-1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT INTO shop (type, target_id, price, stock) VALUES
('POKEMON', 1, 100, 10),
('POKEMON', 2, 120, 15),
('POKEMON', 3, 90, 8),
('POKEMON', 4, 110, 12),
('POKEMON', 5, 130, 5),
('POKEMON', 6, 95, 9),
('POKEMON', 7, 105, 11),
('POKEMON', 8, 115, 7),
('POKEMON', 9, 98, 20),
('POKEMON', 10, 200, 3);