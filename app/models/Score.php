<?php


class Score extends Eloquent {

    public $timestamps = FALSE;

	/**
	 * The database table used by the model.
	 *
	 * @var string
	 */
	protected $table = 'scores';

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array();

    /**
    * The attributes that can be mass assigned
    *
	 * @var array
	 */
	protected $guarded = array();
}

